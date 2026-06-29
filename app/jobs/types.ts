// app/jobs/types.ts

export interface Job {
    id: string;
    title: string;
    school: string;
    schoolInitial: string;
    schoolColor: string;
    location: string;
    state: string;
    salary: string;
    salaryMin: number;
    experience: string; // 'Fresher', '1-3 Years', '3-5 Years', etc.
    subject: string;
    qualification: string;
    board: string; // 'CBSE', 'ICSE', 'State Board'
    jobType: string; // 'Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid'
    gradeLevel: string; // 'Primary', 'Middle School', 'High School'
    postedDate: string;
    postedDaysAgo: number;
    isVerified: boolean;
    isFeatured: boolean;
    rating: number;
    applicants: number;
    tags: string[];
    skillsRequired: string[];
    description: string;
    requirements: string;
    institutionId: string;
    deadline: string; // YYYY-MM-DD
    openPositions: number;
    status: 'active' | 'paused' | 'archived';
    createdAt: string;
}

export interface Application {
    id: string;
    jobId: string;
    jobTitle: string;
    schoolName: string;
    teacherId: string;
    teacherName: string;
    teacherEmail: string;
    status: 'Applied' | 'Viewed' | 'Under Review' | 'Shortlisted' | 'Interview Scheduled' | 'Selected' | 'Rejected' | 'Closed';
    coverLetter?: string;
    resumeUrl: string;
    resumeName: string;
    resumeSize: number;
    resumeBase64?: string;
    appliedAt: string;
    updatedAt: string;
    notes: ApplicationNote[];
    matchScore: number;
    matchDetails: string[];
}

export interface ApplicationNote {
    id: string;
    authorId: string;
    authorName: string;
    note: string;
    createdAt: string;
}

export interface Resume {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    base64?: string;
    strengthScore: number;
    lastUpdated: string; // ISO string
}

export interface CommunicationLog {
    id: string;
    applicationId: string;
    senderId: string;
    senderName: string;
    recipientId: string;
    recipientName: string;
    subject: string;
    message: string;
    templateType: 'interview' | 'shortlist' | 'reject' | 'custom';
    createdAt: string;
}

export interface JobNotification {
    id: string;
    title: string;
    message: string;
    type: 'new_match' | 'app_viewed' | 'shortlisted' | 'interview_invite' | 'job_closing' | 'new_applicant';
    isRead: boolean;
    createdAt: string;
}

export interface TeacherSettings {
    openToWork: boolean;
    availabilityStatus: 'Available Immediately' | 'Available in 15 Days' | 'Available in 30 Days' | 'Not Currently Available';
    visibilitySetting: 'Public' | 'Followers Only' | 'Institutions Only';
    skills: string[];
    experience: string;
    qualification: string;
    subjectExpertise: string;
    preferredLocation: string;
}

export interface InstitutionSettings {
    hiringStatus: 'Actively Hiring' | 'Hiring Soon' | 'Position Filled' | 'Recruitment Closed';
}
