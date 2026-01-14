// Faculty.js (Controller)

import Faculty from "../Model/Faculty.js";

// Get Faculty
export const getFacultyDetails = async (req, res) => {
    try {
        const faculties = await Faculty.find();
        res.status(200).json(faculties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Edit Faculty
export const editFacultyDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedFaculty = await Faculty.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedFaculty) return res.status(404).json({ msg: "Faculty not found" });
        res.status(200).json(updatedFaculty);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete Faculty
export const deleteFacultyAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedFaculty = await Faculty.findByIdAndDelete(id);
        if (!deletedFaculty) return res.status(404).json({ msg: "Faculty not found" });
        res.status(200).json({ msg: "Faculty account deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export default {
    getFacultyDetails,
    editFacultyDetails,
    deleteFacultyAccount
};

