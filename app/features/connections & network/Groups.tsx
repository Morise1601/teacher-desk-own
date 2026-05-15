"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { toast, ToastContainer } from "react-toastify";
import Image from "next/image";
import Modal from "../../shared/Modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";



const initialGroups = [
  {
    id: 1,
    name: "Python Developers Group for Enthusiasts",
    members: "137,379",
    avatar: "https://img.icons8.com/color/48/000000/python.png",
    description: "A place for Python enthusiasts",
    industry: "Software",
    location: "Online",
    rules: "Be respectful",
    type: "public",
    allowInvites: true,
    requireApproval: false,
    background: "",
  },
  {
    id: 2,
    name: "AI, ML, Java, React, Angular, Data Science, Fintech",
    members: "301,875",
    avatar: "https://img.icons8.com/color/48/000000/artificial-intelligence.png",
    description: "AI and ML knowledge sharing",
    industry: "AI",
    location: "Global",
    rules: "Stay on-topic",
    type: "private",
    allowInvites: true,
    requireApproval: true,
    background: "",
  },
];

const Group = () => {
  const [groups, setGroups] = useState(initialGroups);
  const [activeTab, setActiveTab] = useState<"your" | "requested">("your");
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<number | null>(null);
  const menuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Form state
  const initialFormState = {
    name: "",
    description: "",
    industry: "",
    location: "",
    rules: "",
    type: "public",
    allowInvites: true,
    requireApproval: true,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);

  const resetForm = () => {
    setFormData(initialFormState);
    setLogoPreview(null);
    setBgPreview(null);
    setEditingGroup(null);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logo" | "background"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (field === "logo") setLogoPreview(url);
      if (field === "background") setBgPreview(url);
    }
  };

  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        openMenu !== null &&
        menuRefs.current[openMenu] &&
        !menuRefs.current[openMenu]?.contains(e.target as Node)
      ) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  const leaveGroup = (id: number) => {
    const group = groups.find((g) => g.id === id);
    if (!group) return;
    setGroups(groups.filter((g) => g.id !== id));
    toast.info(`You left "${group.name}"`);
    setOpenMenu(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement; // assertion
    const { name, value, type, checked } = target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const confirmCreateGroup = () => {
    setIsConfirmationModalOpen(false);
    setIsCreateModalOpen(false);

    if (editingGroup !== null) {
      // Editing existing group
      const updatedGroups = groups.map((g) =>
        g.id === editingGroup
          ? {
            ...g,
            ...formData,
            avatar: logoPreview || g.avatar,
            background: bgPreview || g.background,
          }
          : g
      );
      setGroups(updatedGroups);
      console.log("Edited Group Data:", { ...formData, logoPreview, bgPreview });
      toast.success("Group updated successfully!");
    } else {
      // Creating new group
      const newGroup = {
        id: Date.now(),
        members: "0",
        avatar:
          logoPreview ||
          "https://img.icons8.com/ios-filled/50/000000/group-foreground-selected.png",
        background: bgPreview || "",
        ...formData,
      };
      setGroups([newGroup, ...groups]);
      console.log("New Group Data:", { ...formData, logoPreview, bgPreview });
      toast.success("Group created successfully!");
    }

    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    setIsCreateModalOpen(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditGroup = (group: any) => {
    setEditingGroup(group.id);
    setFormData({
      name: group.name,
      description: group.description,
      industry: group.industry,
      location: group.location,
      rules: group.rules,
      type: group.type,
      allowInvites: group.allowInvites,
      requireApproval: group.requireApproval,
    });
    setLogoPreview(group.avatar || null);
    setBgPreview(group.background || null);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("your")}
            className={`px-6 py-1 font-medium transition ${activeTab === "your"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Your Groups
          </button>
          <button
            onClick={() => setActiveTab("requested")}
            className={`px-6 py-1 font-medium transition ${activeTab === "requested"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Requested
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="ml-auto px-3 cursor-pointer text-sm bg-[var(--color-primary)] text-white rounded-lg shadow hover:bg-[#0f2c4a] transition"
          >
            + Create Group
          </button>
        </div>

        {/* Animated Tab Content */}
        <ToastContainer />
        <AnimatePresence mode="wait">
          {activeTab === "your" ? (
            <motion.div
              key="your"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              {groups.map((group) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition transform hover:-translate-y-1 hover:scale-[1.01] mb-4"
                >
                  <div className="flex items-center gap-4">
                    <Image
                      src={group.avatar}
                      alt={group.name}
                      width={48}
                      height={48}
                      className="rounded-md border border-gray-200 shadow-sm"
                    />
                    <div>
                      <h2 className="font-semibold text-gray-800">
                        {group.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {group.members} members
                      </p>
                    </div>
                  </div>

                  {/* Menu */}
                  <div
                    className="relative"
                    ref={(el) => {
                      menuRefs.current[group.id] = el;
                    }}
                  >
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === group.id ? null : group.id)
                      }
                      className="p-2 rounded-full hover:bg-gray-100 transition"
                    >
                      <HiOutlineDotsVertical className="w-5 h-5 text-gray-500" />
                    </button>

                    {openMenu === group.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-100 p-2 z-[99999]"
                      >
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                          onClick={() => handleEditGroup(group)}
                        >
                          ✏️ Edit group
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                          onClick={() => toast.info("Link copied!")}
                        >
                          📎 Copy link to group
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                          onClick={() => leaveGroup(group.id)}
                        >
                          🚪 Leave group
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="requested"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-center text-gray-500 mt-6">
                No group requests yet.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create/Edit Group Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCancel}
        title={editingGroup ? "Edit Group" : "Create Group"}
      >
        <div className="space-y-4">
          {/* Background image upload */}
          <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
            {bgPreview ? (
              <Image src={bgPreview} alt="Background" fill className="object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Upload background image
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "background")}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {/* Logo upload */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-lg border bg-gray-50 overflow-hidden">
              {logoPreview ? (
                <Image src={logoPreview} alt="Logo" fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Logo
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "logo")}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-sm text-gray-500">Upload group logo</span>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Group name *
            </Label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-auto"
              placeholder="Enter group name"
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Description *
            </Label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-auto"
              rows={3}
              placeholder="What is the purpose of your group?"
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Industry (up to 3)
            </Label>
            <Input
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleFormChange}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-auto"
              placeholder="Add an industry"
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Location
            </Label>
            <Input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleFormChange}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-auto"
              placeholder="Add a location"
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700">
              Rules
            </Label>
            <Textarea
              name="rules"
              value={formData.rules}
              onChange={handleFormChange}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-auto"
              rows={3}
              placeholder="Set the tone and expectations"
            />
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Group Type
            </Label>
            <RadioGroup
              name="type"
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="public" id="type-public" />
                <Label htmlFor="type-public" className="cursor-pointer">Public</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="private" id="type-private" />
                <Label htmlFor="type-private" className="cursor-pointer">Private</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="allowInvites"
                checked={formData.allowInvites}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowInvites: !!checked }))}
              />
              <Label htmlFor="allowInvites" className="cursor-pointer">Allow members to invite connections</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="requireApproval"
                checked={formData.requireApproval}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requireApproval: !!checked }))}
              />
              <Label htmlFor="requireApproval" className="cursor-pointer">Require posts to be reviewed by admins</Label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsConfirmationModalOpen(true)}
              className="px-4 py-2 cursor-pointer text-sm bg-[var(--color-primary)] text-white rounded-lg shadow hover:bg-[#0f2c4a] transition"
            >
              {editingGroup ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        title={editingGroup ? "Confirm Update Group" : "Confirm Create Group"}
      >
        <p className="text-gray-700">
          Are you sure you want to {editingGroup ? "update" : "create"} this
          group?
        </p>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() => setIsConfirmationModalOpen(false)}
            className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={confirmCreateGroup}
            className="cursor-pointer px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg shadow hover:bg-[#0f2c4a] transition"
          >
            Confirm
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Group;
