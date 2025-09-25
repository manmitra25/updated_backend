import fetch from "node-fetch"; // Node.js 18+ supports global fetch, otherwise install node-fetch
const FASTAPI_URL = "http://127.0.0.1:8000";


// Get analytics for a student
export const getStudentAnalytics = async (req, res) => {
  try {
    const { studentId } = req.params;
    const response = await fetch(`${FASTAPI_URL}/analytics/student/${studentId}`);
    
    if (!response.ok) {
      throw new Error(`FastAPI responded with ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching analytics" });
  }
};

// Get PDF report for a student
export const getStudentPdf = async (req, res) => {
  try {
    const { studentId } = req.params;
    const response = await fetch(`${FASTAPI_URL}/analytics/pdf/${studentId}`);
    
    if (!response.ok) {
      throw new Error(`FastAPI responded with ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${studentId}_report.pdf`);
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generating PDF" });
  }
};
