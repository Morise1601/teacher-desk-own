'use client';

import React, { useState } from "react";
import Modal from "../../shared/Modal"; // adjust path if needed
import { FaPencilAlt, FaTrash } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Type definition for a paper
interface Paper {
  title: string;
  author: string;
  conference: string;
  year: string;
}

// Initial mock data
const initialPapers: Paper[] = [
  {
    title: "A Novel Approach for Distributed System Fault Tolerance",
    author: "S. Raman, R. Kumar, J. Singh",
    conference: "IEEE International Conference on Distributed Computing",
    year: "2023",
  },
  {
    title: "Machine Learning Models for Predictive Analytics in Healthcare",
    author: "A. Sharma, P. Gupta, V. Reddy",
    conference: "International Journal of Health Informatics",
    year: "2022",
  },
  {
    title: "Blockchain Technology in Supply Chain Management",
    author: "K. Patel, M. Khan, N. Iyer",
    conference: "Global Summit on Emerging Technologies",
    year: "2021",
  },
  {
    title: "Quantum Computing and its Applications in Cryptography",
    author: "D. Bose, E. Chen",
    conference: "Conference on Advanced Computing",
    year: "2020",
  },
];

const PapersPresentedSection = () => {
  const [papers, setPapers] = useState<Paper[]>(initialPapers);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState<Paper | null>(null);

  // Open add modal
  const handleAddPaper = () => {
    setModalMode("add");
    setSelectedPaper(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleEditPaper = (paper: Paper) => {
    setModalMode("edit");
    setSelectedPaper(paper);
    setIsModalOpen(true);
  };

  // Open delete confirmation modal
  const handleDeletePaper = (paper: Paper) => {
    setPaperToDelete(paper);
    setIsDeleteModalOpen(true);
  };

  // Confirm deletion
  const confirmDeletePaper = () => {
    if (paperToDelete) {
      setPapers(papers.filter((p) => p.title !== paperToDelete.title));
      setPaperToDelete(null);
    }
    setIsDeleteModalOpen(false);
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const newPaper: Paper = {
      title: formData.get("title") as string,
      author: formData.get("author") as string,
      conference: formData.get("conference") as string,
      year: formData.get("year") as string,
    };

    if (modalMode === "add") {
      setPapers([...papers, newPaper]);
    } else if (modalMode === "edit" && selectedPaper) {
      setPapers(
        papers.map((p) =>
          p.title === selectedPaper.title ? newPaper : p
        )
      );
    }

    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Papers Presented
          </h2>
          <button
            onClick={handleAddPaper}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors duration-200"
            aria-label="Add new paper"
          >
            {/* Plus Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline font-medium">Add New</span>
          </button>
        </div>

        {/* Papers List */}
        {papers.length === 0 ? (
          <p className="text-gray-500 text-center">No papers added yet.</p>
        ) : (
          <div className="space-y-6">
            {papers.map((paper) => (
              <div
                key={paper.title}
                className="bg-gray-50 border border-gray-200 rounded-lg p-5 md:p-6 shadow-sm transition-transform duration-300 hover:scale-[1.01] hover:shadow-lg flex items-start space-x-4"
              >
                {/* Paper details */}
                <div className="flex-grow">
                  <h3 className="text-xl font-bold mb-2">{paper.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">Author:</span> {paper.author}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">Conference:</span> {paper.conference}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Year:</span>{" "}
                    <span className="inline-block bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-1 rounded">
                      {paper.year}
                    </span>
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditPaper(paper)}
                    className="text-gray-400 hover:text-blue-600 cursor-pointer transition-colors duration-200 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Edit paper"
                  >
                    <FaPencilAlt />
                  </button>
                  <button
                    onClick={() => handleDeletePaper(paper)}
                    className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label="Delete paper"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === "add" ? "Add New Paper" : "Edit Paper"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Title
            </Label>
            <Input
              type="text"
              name="title"
              defaultValue={selectedPaper?.title || ""}
              className="w-full border rounded-md px-3 py-2 mt-1 h-auto"
              required
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Author
            </Label>
            <Input
              type="text"
              name="author"
              defaultValue={selectedPaper?.author || ""}
              className="w-full border rounded-md px-3 py-2 mt-1 h-auto"
              required
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Conference
            </Label>
            <Input
              type="text"
              name="conference"
              defaultValue={selectedPaper?.conference || ""}
              className="w-full border rounded-md px-3 py-2 mt-1 h-auto"
              required
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Year
            </Label>
            <Input
              type="text"
              name="year"
              defaultValue={selectedPaper?.year || ""}
              className="w-full border rounded-md px-3 py-2 mt-1 h-auto"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              {modalMode === "add" ? "Add Paper" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal for Delete Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Confirmation"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{paperToDelete?.title}</span>?
          </p>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeletePaper}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PapersPresentedSection;
