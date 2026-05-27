import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { Assignment } from "../models/Assignment";
import { GeneratedPaper } from "../models/GeneratedPaper";
import { enqueueGeneration } from "../queue/generationQueue";
import { emitToAssignment } from "../socket/io";
import { generatePdfBuffer } from "../services/pdfService";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const {
      title,
      subject,
      grade,
      school,
      dueDate,
      questionTypes,
      additionalInstructions,
    } = req.body;

    let parsedQuestionTypes = questionTypes;
    if (typeof questionTypes === "string") {
      parsedQuestionTypes = JSON.parse(questionTypes);
    }

    const assignment = await Assignment.create({
      title,
      subject,
      grade,
      school,
      dueDate: new Date(dueDate),
      fileUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      questionTypes: parsedQuestionTypes,
      additionalInstructions: additionalInstructions || "",
      status: "pending",
    });

    await enqueueGeneration(assignment._id.toString());

    res.status(201).json({
      assignmentId: assignment._id,
      assignment,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create assignment";
    res.status(500).json({ error: message });
  }
});

router.get("/", async (_req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find()
      .sort({ createdAt: -1 })
      .lean();
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assignment" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    await GeneratedPaper.deleteMany({ assignmentId: req.params.id });
    res.json({ message: "Assignment deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

router.get("/:id/result", async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    if (!assignment.resultId) {
      return res.status(404).json({
        error: "Result not ready",
        status: assignment.status,
      });
    }
    const paper = await GeneratedPaper.findById(assignment.resultId).lean();
    if (!paper) {
      return res.status(404).json({ error: "Generated paper not found" });
    }
    res.json(paper);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch result" });
  }
});

router.get("/:id/result/pdf", async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment?.resultId) {
      return res.status(404).json({ error: "Result not available" });
    }
    const paper = await GeneratedPaper.findById(assignment.resultId);
    if (!paper) {
      return res.status(404).json({ error: "Generated paper not found" });
    }

    const pdfBuffer = await generatePdfBuffer(paper);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="question-paper.pdf"'
    );
    res.send(pdfBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF generation failed";
    res.status(500).json({ error: message });
  }
});

router.post("/:id/regenerate", async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const oldResultId = assignment.resultId;
    assignment.status = "pending";
    assignment.resultId = undefined;
    await assignment.save();

    if (oldResultId) {
      await GeneratedPaper.findByIdAndDelete(oldResultId);
    }

    await enqueueGeneration(assignment._id.toString());
    emitToAssignment(assignment._id.toString(), "assignment:processing", {
      assignmentId: assignment._id.toString(),
    });

    res.json({ message: "Regeneration queued", assignmentId: assignment._id });
  } catch (error) {
    res.status(500).json({ error: "Failed to regenerate" });
  }
});

export default router;
