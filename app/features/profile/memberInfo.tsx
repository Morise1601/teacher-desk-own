/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";

interface MemberInfoProps {
  profile: any;
  editedProfile: any;
  setEditedProfile: (profile: any) => void;
  isEditing: boolean;
}

const MemberInfo: React.FC<MemberInfoProps> = ({ editedProfile, setEditedProfile, isEditing }) => {
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);

  const renderField = (name: string, value: string, type = 'text', onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => {
    return isEditing ? (
      <Input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="text-sm w-full border border-gray-300 rounded-lg p-2 mt-1 h-auto"
      />
    ) : (
      <span className="text-gray-700">{value}</span>
    );
  };

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProfile((prev: { personalInfo: any; }) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [name]: value }
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Member Information</h2>
      </div>
      <div className="space-y-4">
        <button
          onClick={() => setShowPersonalInfo(!showPersonalInfo)}
          className="text-indigo-600 hover:underline"
        >
          {showPersonalInfo ? 'Hide Personal Info' : 'Show Personal Info'}
        </button>
        {showPersonalInfo && (
          <div className="space-y-2">
            <div>
              <h4 className="font-semibold">Date of Birth:</h4>
              {renderField('dob', editedProfile.personalInfo.dob, 'text', handlePersonalChange)}
            </div>
            <div>
              <h4 className="font-semibold">Gender (Optional):</h4>
              {renderField('gender', editedProfile.personalInfo.gender, 'text', handlePersonalChange)}
            </div>
            <div>
              <h4 className="font-semibold">Contact Details (Phone, Email):</h4>
              {renderField('contactDetails', editedProfile.personalInfo.contactDetails, 'text', handlePersonalChange)}
            </div>
            <div>
              <h4 className="font-semibold">Address (City, State, Country):</h4>
              {renderField('address', editedProfile.personalInfo.address, 'text', handlePersonalChange)}
            </div>
          </div>
        )}
        <p className="text-red-500 text-sm">You should have an option to disclose it or not.</p>
      </div>
    </div>
  );
};

export default MemberInfo;
