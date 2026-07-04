// app/jobs/jobsRepository.ts

import { 
    Job, Application, Resume, CommunicationLog, 
    JobNotification, TeacherSettings, InstitutionSettings 
} from './types';
import { supabase } from '@/lib/supabase';

// Helper to determine if we are in the browser
const isBrowser = typeof window !== 'undefined';

// Initial default jobs
const defaultJobs: Job[] = [
    {
        id: '1', title: 'Senior Mathematics Teacher', school: 'Delhi Public School', schoolInitial: 'DPS',
        schoolColor: '#143c64', location: 'New Delhi', state: 'Delhi', salary: '₹45,000 – ₹65,000',
        salaryMin: 45000, experience: '3-5 Years', subject: 'Mathematics',
        qualification: 'M.Ed', board: 'CBSE', jobType: 'Full-time', gradeLevel: 'High School',
        postedDate: '2 days ago', postedDaysAgo: 2, isVerified: true, isFeatured: true,
        rating: 4.8, applicants: 38, tags: ['CBSE', 'Maths', 'Full-time'],
        skillsRequired: ['Algebra', 'Calculus', 'Pedagogy', 'Classroom Management'],
        description: 'Provide math lectures and lead curriculum mapping for senior grade students. Set examinations, administer grading boards, and conduct tutorial classes.',
        requirements: 'Possess a Master degree in Mathematics or equivalent field, together with a valid B.Ed/M.Ed credential and a minimum of 3 years of classroom experience.',
        institutionId: 'institution-session-456',
        deadline: '2026-07-15', openPositions: 2, status: 'active',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: '2', title: 'Physics Teacher (PGT)', school: 'Ryan International School', schoolInitial: 'RIS',
        schoolColor: '#12501b', location: 'Mumbai', state: 'Maharashtra', salary: '₹40,000 – ₹55,000',
        salaryMin: 40000, experience: '1-3 Years', subject: 'Physics',
        qualification: 'B.Ed', board: 'ICSE', jobType: 'Full-time', gradeLevel: 'High School',
        postedDate: '1 day ago', postedDaysAgo: 1, isVerified: true, isFeatured: false,
        rating: 4.5, applicants: 22, tags: ['ICSE', 'Physics', 'PGT'],
        skillsRequired: ['Thermodynamics', 'Optics', 'Laboratory Instruction', 'Curriculum Design'],
        description: 'Deliver lectures on classical and modern mechanics, optics, and thermodynamics. Manage high-school science laboratory courses and support science fair projects.',
        requirements: 'Degree in Physics or related sciences, B.Ed teaching license, and experience with laboratory equipment and safe class protocols.',
        institutionId: 'institution-session-456',
        deadline: '2026-07-10', openPositions: 1, status: 'active',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: '3', title: 'English Language Teacher', school: 'Kendriya Vidyalaya', schoolInitial: 'KV',
        schoolColor: '#b45309', location: 'Bangalore', state: 'Karnataka', salary: '₹30,000 – ₹45,000',
        salaryMin: 30000, experience: 'Fresher', subject: 'English',
        qualification: 'B.Ed', board: 'CBSE', jobType: 'Full-time', gradeLevel: 'Middle School',
        postedDate: '3 days ago', postedDaysAgo: 3, isVerified: false, isFeatured: false,
        rating: 4.2, applicants: 56, tags: ['CBSE', 'English', 'Fresher'],
        skillsRequired: ['Grammar', 'Creative Writing', 'Literature Coaching', 'Interpersonal Skills'],
        description: 'Conduct interactive grammar sessions, creative writing modules, and guided literature analysis for middle school classes.',
        requirements: 'Bachelor degree in English Literature, excellent communication fluency, B.Ed degree, and a passion for working with junior/middle school kids.',
        institutionId: 'institution-session-456',
        deadline: '2026-07-20', openPositions: 3, status: 'active',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: '4', title: 'Computer Science Teacher', school: 'The Heritage School', schoolInitial: 'THS',
        schoolColor: '#7c3aed', location: 'Kolkata', state: 'West Bengal', salary: '₹35,000 – ₹50,000',
        salaryMin: 35000, experience: '1-3 Years', subject: 'Computer Science',
        qualification: 'B.Ed', board: 'CBSE', jobType: 'Full-time', gradeLevel: 'High School',
        postedDate: 'Today', postedDaysAgo: 0, isVerified: true, isFeatured: true,
        rating: 4.6, applicants: 14, tags: ['CBSE', 'CS', 'Tech'],
        skillsRequired: ['Python', 'Java', 'Data Structures', 'Coding Mentorship'],
        description: 'Teach object-oriented programming, basic algorithms, data structures, and computer networking. Lead code clubs and hackathon preparation groups.',
        requirements: 'B.Tech/B.Sc in Computer Science, B.Ed or equivalent teacher training, and experience programming in Python and Java.',
        institutionId: 'institution-session-456',
        deadline: '2026-07-05', openPositions: 1, status: 'active',
        createdAt: new Date().toISOString()
    },
    {
        id: '5', title: 'Biology Teacher (TGT)', school: "St. Xavier's High School", schoolInitial: 'SXS',
        schoolColor: '#dc2626', location: 'Chennai', state: 'Tamil Nadu', salary: '₹28,000 – ₹40,000',
        salaryMin: 28000, experience: 'Fresher', subject: 'Biology',
        qualification: 'B.Ed', board: 'State Board', jobType: 'Full-time', gradeLevel: 'Middle School',
        postedDate: '5 days ago', postedDaysAgo: 5, isVerified: false, isFeatured: false,
        rating: 4.0, applicants: 31, tags: ['State Board', 'Biology', 'TGT'],
        skillsRequired: ['Botany', 'Zoology', 'Microscopy Instruction', 'Lesson Planning'],
        description: 'Introduce students to cell biology, genetics, ecology, botany, and human anatomy. Formulate slide preparation experiments.',
        requirements: 'Relevant undergraduate major in Biological Sciences, active B.Ed credentials, and willingness to coordinate environmental awareness committees.',
        institutionId: 'institution-session-456',
        deadline: '2026-07-22', openPositions: 2, status: 'active',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: '6', title: 'Montessori Primary Teacher', school: 'Little Flowers Montessori', schoolInitial: 'LFM',
        schoolColor: '#0891b2', location: 'Pune', state: 'Maharashtra', salary: '₹22,000 – ₹32,000',
        salaryMin: 22000, experience: 'Fresher', subject: 'General',
        qualification: 'Montessori', board: 'State Board', jobType: 'Full-time', gradeLevel: 'Primary',
        postedDate: '1 week ago', postedDaysAgo: 7, isVerified: true, isFeatured: false,
        rating: 4.7, applicants: 18, tags: ['Montessori', 'Primary', 'Full-time'],
        skillsRequired: ['Child Development', 'Montessori Method', 'Sensory Activities', 'Early Childhood Ed'],
        description: 'Deliver child-centered early education using dedicated sensory apparatus. Support emotional growth, basic vocabulary, and socialization exercises.',
        requirements: 'Montessori diploma/certification, early childhood training qualifications, warm interpersonal skills, and patient child coordination.',
        institutionId: 'institution-session-456',
        deadline: '2026-07-30', openPositions: 4, status: 'active',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: '7', title: 'Chemistry Teacher (Part-time)', school: 'Amity International School', schoolInitial: 'AIS',
        schoolColor: '#059669', location: 'Noida', state: 'Uttar Pradesh', salary: '₹20,000 – ₹30,000',
        salaryMin: 20000, experience: '1-3 Years', subject: 'Chemistry',
        qualification: 'M.Ed', board: 'CBSE', jobType: 'Part-time', gradeLevel: 'High School',
        postedDate: '4 days ago', postedDaysAgo: 4, isVerified: true, isFeatured: false,
        rating: 4.4, applicants: 9, tags: ['CBSE', 'Chemistry', 'Part-time'],
        skillsRequired: ['Organic Chemistry', 'Stoichiometry', 'Lab Safety', 'Lesson Presentation'],
        description: 'Part-time instruction in chemical reactions, kinetics, and lab setups. Guide safety guidelines inside chemistry labs and prepare students for CBSE board exams.',
        requirements: 'Masters in Chemistry, valid B.Ed/M.Ed certification, strong understanding of CBSE board curricula, and part-time availability.',
        institutionId: 'institution-session-456',
        deadline: '2026-07-18', openPositions: 1, status: 'active',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: '8', title: 'Special Education Teacher', school: 'Bloom International School', schoolInitial: 'BIS',
        schoolColor: '#e11d48', location: 'Hyderabad', state: 'Telangana', salary: '₹35,000 – ₹48,000',
        salaryMin: 35000, experience: '3-5 Years', subject: 'Special Education',
        qualification: 'M.Ed', board: 'CBSE', jobType: 'Full-time', gradeLevel: 'Primary',
        postedDate: '6 days ago', postedDaysAgo: 6, isVerified: true, isFeatured: true,
        rating: 4.9, applicants: 7, tags: ['Special Ed', 'CBSE', 'Full-time'],
        skillsRequired: ['Individualized Education Plans (IEP)', 'Behavioral Intervention', 'Special Needs Tutoring', 'Patience'],
        description: 'Manage specialized primary education classrooms. Author and supervise IEP documents, adapt academic resources, and lead behavioral developmental training.',
        requirements: 'Degree in Special Education (M.Ed/B.Ed Special Ed), certification for behavioral therapy, and 3+ years experience with neurodiverse children.',
        institutionId: 'institution-session-456',
        deadline: '2026-07-12', openPositions: 2, status: 'active',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    }
];

const defaultTeacherSettings: TeacherSettings = {
    openToWork: true,
    availabilityStatus: 'Available Immediately',
    visibilitySetting: 'Public',
    skills: ['Algebra', 'Calculus', 'Pedagogy', 'Python', 'Interpersonal Skills'],
    experience: '3-5 Years',
    qualification: 'M.Ed',
    subjectExpertise: 'Mathematics',
    preferredLocation: 'New Delhi'
};

const defaultInstitutionSettings: InstitutionSettings = {
    hiringStatus: 'Actively Hiring'
};

// Storage helper functions
const getStorageItem = <T>(key: string, defaultValue: T): T => {
    if (!isBrowser) return defaultValue;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
};

const setStorageItem = <T>(key: string, value: T): void => {
    if (isBrowser) {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

// Main Repository
export const jobsRepository = {
    // --- JOBS CRUD ---
    getJobs: async (): Promise<Job[]> => {
        try {
            const { data: dbJobs, error } = await supabase
                .from('posted_jobs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (dbJobs && dbJobs.length > 0) {
                // Fetch corresponding school names from institutions
                const instIds = Array.from(new Set(dbJobs.map(j => j.institution_id).filter(Boolean)));
                let instMap = new Map<string, string>();
                if (instIds.length > 0) {
                    const { data: insts } = await supabase
                        .from('institutions')
                        .select('auth_id, name')
                        .in('auth_id', instIds);
                    instMap = new Map(insts?.map(i => [i.auth_id, i.name]) || []);
                }

                // Map database columns to the frontend camelCase Job structure
                return dbJobs.map((j: any) => {
                    const schoolName = instMap.get(j.institution_id) || 'Ryan International School';
                    const schoolInitial = schoolName.split(' ').map((w: string) => w[0]).join('').substring(0, 3).toUpperCase();
                    
                    const colors = ['#143c64', '#12501b', '#b45309', '#7c3aed', '#dc2626', '#0891b2', '#059669', '#e11d48'];
                    const colorIndex = schoolInitial.length > 0 ? schoolInitial.charCodeAt(0) % colors.length : 0;

                    return {
                        id: j.id,
                        title: j.title || '',
                        school: schoolName,
                        schoolInitial,
                        schoolColor: colors[colorIndex],
                        location: j.location || '',
                        state: j.state || '',
                        salary: j.salary_range || 'Competitive',
                        salaryMin: j.salary_min || 0,
                        experience: j.experience_required || 'Fresher',
                        subject: j.subject || '',
                        qualification: 'M.Ed', 
                        board: j.board || 'CBSE',
                        jobType: j.employment_type || 'Full-time',
                        gradeLevel: j.gradeLevel || 'High School',
                        postedDate: 'Today',
                        postedDaysAgo: 0,
                        isVerified: true,
                        isFeatured: false,
                        rating: 4.5,
                        applicants: 0,
                        tags: j.skills_required || [],
                        skillsRequired: j.skills_required || [],
                        description: j.description || '',
                        requirements: j.requirements || '',
                        institutionId: j.institution_id || '',
                        deadline: j.deadline || '',
                        openPositions: j.positions_open || 1,
                        status: j.status || 'active',
                        createdAt: j.created_at || new Date().toISOString()
                    };
                });
            }
        } catch (err) {
            console.error("Failed to load jobs from Supabase, falling back to local storage:", err);
        }
        return getStorageItem<Job[]>('td_jobs_list', defaultJobs);
    },

    saveJobs: async (jobs: Job[]): Promise<void> => {
        setStorageItem('td_jobs_list', jobs);
    },

    createJob: async (jobData: Omit<Job, 'id' | 'postedDate' | 'postedDaysAgo' | 'applicants' | 'createdAt' | 'schoolInitial' | 'schoolColor' | 'rating' | 'isVerified'> & { school: string }): Promise<Job> => {
        try {
            // Resolve active session user
            const { data: { user } } = await supabase.auth.getUser();
            const instId = user ? user.id : jobData.institutionId;

            // Fetch name from institutions if user is logged in
            let schoolName = jobData.school;
            if (user) {
                const { data: inst } = await supabase
                    .from('institutions')
                    .select('name')
                    .eq('auth_id', user.id)
                    .maybeSingle();
                if (inst?.name) schoolName = inst.name;
            }

            const dbPayload = {
                institution_id: instId,
                title: jobData.title,
                subject: jobData.subject,
                description: jobData.description,
                requirements: jobData.requirements,
                experience_required: jobData.experience,
                salary_range: jobData.salary,
                salary_min: jobData.salaryMin,
                employment_type: jobData.jobType,
                location: jobData.location,
                state: jobData.state,
                board: jobData.board,
                deadline: jobData.deadline,
                positions_open: jobData.openPositions,
                skills_required: jobData.skillsRequired,
                status: jobData.status || 'active'
            };

            const { data: newDbJob, error } = await supabase
                .from('posted_jobs')
                .insert([dbPayload])
                .select()
                .single();

            if (error) throw error;

            if (newDbJob) {
                const schoolInitial = schoolName.split(' ').map((w: string) => w[0]).join('').substring(0, 3).toUpperCase();
                const colors = ['#143c64', '#12501b', '#b45309', '#7c3aed', '#dc2626', '#0891b2', '#059669', '#e11d48'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];

                return {
                    id: newDbJob.id,
                    title: newDbJob.title,
                    school: schoolName,
                    schoolInitial,
                    schoolColor: randomColor,
                    location: newDbJob.location,
                    state: newDbJob.state || '',
                    salary: newDbJob.salary_range || 'Competitive',
                    salaryMin: newDbJob.salary_min || 0,
                    experience: newDbJob.experience_required || 'Fresher',
                    subject: newDbJob.subject,
                    qualification: jobData.qualification || 'M.Ed',
                    board: newDbJob.board || 'CBSE',
                    jobType: newDbJob.employment_type || 'Full-time',
                    gradeLevel: jobData.gradeLevel || 'High School',
                    postedDate: 'Today',
                    postedDaysAgo: 0,
                    applicants: 0,
                    isVerified: true,
                    isFeatured: false,
                    rating: 4.5,
                    tags: newDbJob.skills_required || [],
                    skillsRequired: newDbJob.skills_required || [],
                    description: newDbJob.description || '',
                    requirements: newDbJob.requirements || '',
                    institutionId: newDbJob.institution_id,
                    deadline: newDbJob.deadline || '',
                    openPositions: newDbJob.positions_open || 1,
                    status: newDbJob.status || 'active',
                    createdAt: newDbJob.created_at
                };
            }
        } catch (err) {
            console.error("Failed to save job in Supabase, falling back to local storage:", err);
        }

        // Fallback to local storage
        const jobs = await jobsRepository.getJobs();
        const schoolInitial = jobData.school.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
        
        const colors = ['#143c64', '#12501b', '#b45309', '#7c3aed', '#dc2626', '#0891b2', '#059669', '#e11d48'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newJob: Job = {
            ...jobData,
            id: Math.random().toString(36).substring(2, 9),
            schoolInitial,
            schoolColor: randomColor,
            rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)),
            postedDate: 'Today',
            postedDaysAgo: 0,
            applicants: 0,
            isVerified: true,
            createdAt: new Date().toISOString()
        };

        const isDuplicate = jobs.some(j => 
            j.title.toLowerCase() === newJob.title.toLowerCase() &&
            j.school.toLowerCase() === newJob.school.toLowerCase() &&
            j.location.toLowerCase() === newJob.location.toLowerCase() &&
            j.subject.toLowerCase() === newJob.subject.toLowerCase()
        );

        if (isDuplicate) {
            throw new Error('A job post with this title, subject, and school already exists.');
        }

        jobs.unshift(newJob);
        await jobsRepository.saveJobs(jobs);
        return newJob;
    },

    updateJob: async (id: string, updatedFields: Partial<Job>): Promise<Job> => {
        try {
            const dbPayload: any = {};
            if (updatedFields.title !== undefined) dbPayload.title = updatedFields.title;
            if (updatedFields.subject !== undefined) dbPayload.subject = updatedFields.subject;
            if (updatedFields.description !== undefined) dbPayload.description = updatedFields.description;
            if (updatedFields.requirements !== undefined) dbPayload.requirements = updatedFields.requirements;
            if (updatedFields.experience !== undefined) dbPayload.experience_required = updatedFields.experience;
            if (updatedFields.salary !== undefined) dbPayload.salary_range = updatedFields.salary;
            if (updatedFields.salaryMin !== undefined) dbPayload.salary_min = updatedFields.salaryMin;
            if (updatedFields.jobType !== undefined) dbPayload.employment_type = updatedFields.jobType;
            if (updatedFields.location !== undefined) dbPayload.location = updatedFields.location;
            if (updatedFields.state !== undefined) dbPayload.state = updatedFields.state;
            if (updatedFields.board !== undefined) dbPayload.board = updatedFields.board;
            if (updatedFields.deadline !== undefined) dbPayload.deadline = updatedFields.deadline;
            if (updatedFields.openPositions !== undefined) dbPayload.positions_open = updatedFields.openPositions;
            if (updatedFields.skillsRequired !== undefined) dbPayload.skills_required = updatedFields.skillsRequired;
            if (updatedFields.status !== undefined) dbPayload.status = updatedFields.status;

            const { error } = await supabase
                .from('posted_jobs')
                .update(dbPayload)
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error("Failed to update job in Supabase, falling back to local storage:", err);
        }

        const jobs = await jobsRepository.getJobs();
        const index = jobs.findIndex(j => j.id === id);
        if (index === -1) throw new Error('Job not found.');
        
        const updatedJob = { ...jobs[index], ...updatedFields, updatedAt: new Date().toISOString() };
        jobs[index] = updatedJob;
        await jobsRepository.saveJobs(jobs);
        return updatedJob;
    },

    deleteJob: async (id: string): Promise<void> => {
        try {
            const { error } = await supabase.from('posted_jobs').delete().eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error("Failed to delete job from Supabase:", err);
        }
        const jobs = await jobsRepository.getJobs();
        const filtered = jobs.filter(j => j.id !== id);
        await jobsRepository.saveJobs(filtered);
    },

    // --- SAVED JOBS (BOOKMARKS) ---
    getSavedJobsList: async (teacherId: string): Promise<string[]> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const actualTeacherId = user ? user.id : teacherId;

            const { data: saved, error } = await supabase
                .from('job_saved')
                .select('job_id')
                .eq('teacher_id', actualTeacherId);

            if (!error && saved) {
                return saved.map(s => s.job_id);
            }
        } catch (err) {
            console.error("Failed to load saved jobs from Supabase, falling back to local storage:", err);
        }
        const saved = getStorageItem<Record<string, string[]>>('td_saved_jobs_map', {});
        return saved[teacherId] || [];
    },

    toggleSaveJob: async (teacherId: string, jobId: string): Promise<boolean> => {
        let isSaved = false;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const actualTeacherId = user ? user.id : teacherId;

            const { data: existing } = await supabase
                .from('job_saved')
                .select('id')
                .eq('teacher_id', actualTeacherId)
                .eq('job_id', jobId)
                .maybeSingle();

            if (existing) {
                await supabase.from('job_saved').delete().eq('id', existing.id);
                isSaved = false;
            } else {
                await supabase.from('job_saved').insert([{
                    teacher_id: actualTeacherId,
                    job_id: jobId
                }]);
                isSaved = true;
            }
        } catch (err) {
            console.error("Failed to toggle save job in Supabase, falling back to local storage:", err);
            const saved = getStorageItem<Record<string, string[]>>('td_saved_jobs_map', {});
            const teacherSaved = saved[teacherId] || [];
            isSaved = teacherSaved.includes(jobId);
            
            let newSaved: string[];
            if (isSaved) {
                newSaved = teacherSaved.filter(id => id !== jobId);
                isSaved = false;
            } else {
                newSaved = [...teacherSaved, jobId];
                isSaved = true;
            }
            
            saved[teacherId] = newSaved;
            setStorageItem('td_saved_jobs_map', saved);
        }
        return isSaved;
    },

    // --- RESUME UPLOAD ---
    getResume: async (teacherId: string): Promise<Resume | null> => {
        const resumes = getStorageItem<Record<string, Resume>>('td_resumes_map', {});
        return resumes[teacherId] || null;
    },

    saveResume: async (teacherId: string, fileData: { fileName: string; fileSize: number; base64: string }): Promise<Resume> => {
        const score = calculateResumeStrength(fileData.fileName, fileData.base64);
        const newResume: Resume = {
            fileUrl: fileData.base64, 
            fileName: fileData.fileName,
            fileSize: fileData.fileSize,
            base64: fileData.base64,
            strengthScore: score,
            lastUpdated: new Date().toISOString()
        };

        const resumes = getStorageItem<Record<string, Resume>>('td_resumes_map', {});
        resumes[teacherId] = newResume;
        setStorageItem('td_resumes_map', resumes);
        
        const notif: Omit<JobNotification, 'id' | 'isRead' | 'createdAt'> = {
            title: 'Resume Strength Calculated',
            message: `Your resume "${fileData.fileName}" scored a strength rating of ${score}%. Complete other sections to reach 100%.`,
            type: 'new_match'
        };
        await jobsRepository.addNotification(teacherId, notif);

        return newResume;
    },

    deleteResume: async (teacherId: string): Promise<void> => {
        const resumes = getStorageItem<Record<string, Resume>>('td_resumes_map', {});
        delete resumes[teacherId];
        setStorageItem('td_resumes_map', resumes);
    },

    // --- JOB APPLICATIONS ---
    getApplications: async (): Promise<Application[]> => {
        try {
            const { data: dbApps, error } = await supabase
                .from('job_applications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (dbApps && dbApps.length > 0) {
                const jobIds = Array.from(new Set(dbApps.map(a => a.job_id).filter(Boolean)));
                const teacherIds = Array.from(new Set(dbApps.map(a => a.teacher_id).filter(Boolean)));

                const [jobs, teachers] = await Promise.all([
                    jobsRepository.getJobs(),
                    supabase.from('teachers').select('auth_id, full_name, email').in('auth_id', teacherIds)
                ]);

                const jobsMap = new Map(jobs.map(j => [j.id, j]));
                const teachersMap = new Map(teachers.data?.map(t => [t.auth_id, t]) || []);

                return dbApps.map((a: any) => {
                    const job = jobsMap.get(a.job_id);
                    const teacher = teachersMap.get(a.teacher_id);
                    const score = job ? 85 : 50; 

                    return {
                        id: a.id,
                        jobId: a.job_id,
                        jobTitle: job?.title || 'Unknown Position',
                        schoolName: job?.school || 'Unknown School',
                        teacherId: a.teacher_id,
                        teacherName: teacher?.full_name || 'Educator',
                        teacherEmail: teacher?.email || '',
                        status: (a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1) : 'Applied') as any,
                        coverLetter: a.cover_letter || '',
                        resumeUrl: a.resume_url || '',
                        resumeName: a.resume_name || 'Resume.pdf',
                        resumeSize: 0,
                        appliedAt: a.created_at || new Date().toISOString(),
                        updatedAt: a.updated_at || new Date().toISOString(),
                        notes: [], 
                        matchScore: score,
                        matchDetails: []
                    };
                });
            }
        } catch (err) {
            console.error("Failed to load applications from Supabase, falling back to local storage:", err);
        }
        return getStorageItem<Application[]>('td_applications_list', []);
    },

    saveApplications: async (apps: Application[]): Promise<void> => {
        setStorageItem('td_applications_list', apps);
    },

    applyJob: async (applicationData: { 
        jobId: string; 
        teacherId: string; 
        teacherName: string; 
        teacherEmail: string; 
        coverLetter?: string;
    }): Promise<Application> => {
        const jobs = await jobsRepository.getJobs();
        const job = jobs.find(j => j.id === applicationData.jobId);
        if (!job) throw new Error('Job listing does not exist.');

        const resume = await jobsRepository.getResume(applicationData.teacherId);
        if (!resume) throw new Error('Please upload a professional resume before applying.');

        const profileSettings = await jobsRepository.getTeacherSettings(applicationData.teacherId);
        const { score, details } = calculateMatchScore(job, profileSettings);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const actualTeacherId = user ? user.id : applicationData.teacherId;

            const dbPayload = {
                job_id: applicationData.jobId,
                teacher_id: actualTeacherId,
                status: 'applied',
                cover_letter: applicationData.coverLetter || '',
                resume_url: resume.fileUrl,
                resume_name: resume.fileName
            };

            const { data: newDbApp, error } = await supabase
                .from('job_applications')
                .insert([dbPayload])
                .select()
                .single();

            if (error) throw error;
        } catch (err) {
            console.error("Failed to apply for job in Supabase, falling back to local storage:", err);
        }

        const apps = await jobsRepository.getApplications();
        const newApp: Application = {
            id: Math.random().toString(36).substring(2, 9),
            jobId: applicationData.jobId,
            jobTitle: job.title,
            schoolName: job.school,
            teacherId: applicationData.teacherId,
            teacherName: applicationData.teacherName,
            teacherEmail: applicationData.teacherEmail,
            status: 'Applied',
            coverLetter: applicationData.coverLetter,
            resumeUrl: resume.fileUrl,
            resumeName: resume.fileName,
            resumeSize: resume.fileSize,
            resumeBase64: resume.base64,
            appliedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: [],
            matchScore: score,
            matchDetails: details
        };

        apps.unshift(newApp);
        await jobsRepository.saveApplications(apps);

        job.applicants += 1;
        await jobsRepository.saveJobs(jobs);

        await jobsRepository.addNotification(job.institutionId || 'institution-id-dummy', {
            title: 'New Applicant Received',
            message: `${applicationData.teacherName} applied for "${job.title}" with a matching score of ${score}%.`,
            type: 'new_applicant'
        });

        await jobsRepository.addNotification(applicationData.teacherId, {
            title: 'Application Sent Successfully',
            message: `Your application for "${job.title}" at ${job.school} was successfully submitted.`,
            type: 'app_viewed'
        });

        return newApp;
    },

    updateApplicationStatus: async (appId: string, status: Application['status']): Promise<Application> => {
        try {
            const { error } = await supabase
                .from('job_applications')
                .update({ 
                    status: status.toLowerCase(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', appId);

            if (error) throw error;
        } catch (err) {
            console.error("Failed to update application status in Supabase:", err);
        }

        const apps = await jobsRepository.getApplications();
        const index = apps.findIndex(a => a.id === appId);
        if (index === -1) throw new Error('Application record not found.');

        const app = apps[index];
        app.status = status;
        app.updatedAt = new Date().toISOString();
        
        apps[index] = app;
        await jobsRepository.saveApplications(apps);

        let title = 'Application Status Updated';
        let msg = `Your application for "${app.jobTitle}" is now: ${status}.`;
        let notifType: JobNotification['type'] = 'app_viewed';

        if (status === 'Shortlisted') {
            title = 'Application Shortlisted! 🎉';
            msg = `Congratulations! You have been shortlisted for "${app.jobTitle}" at ${app.schoolName}.`;
            notifType = 'shortlisted';
        } else if (status === 'Interview Scheduled') {
            title = 'Interview Scheduled! 📅';
            msg = `An interview has been scheduled for your application to "${app.jobTitle}". Please check your messages.`;
            notifType = 'interview_invite';
        }

        await jobsRepository.addNotification(app.teacherId, {
            title,
            message: msg,
            type: notifType
        });

        return app;
    },

    addApplicationNote: async (appId: string, noteText: string, authorId: string, authorName: string): Promise<Application> => {
        const apps = await jobsRepository.getApplications();
        const index = apps.findIndex(a => a.id === appId);
        if (index === -1) throw new Error('Application record not found.');

        const app = apps[index];
        const newNote = {
            id: Math.random().toString(36).substring(2, 9),
            authorId,
            authorName,
            note: noteText,
            createdAt: new Date().toISOString()
        };

        app.notes.push(newNote);
        apps[index] = app;
        await jobsRepository.saveApplications(apps);
        return app;
    },

    // --- COMMUNICATION LOGS ---
    getCommunicationLogs: async (applicationId: string): Promise<CommunicationLog[]> => {
        const logs = getStorageItem<CommunicationLog[]>('td_communication_logs', []);
        return logs.filter(l => l.applicationId === applicationId);
    },

    addCommunicationLog: async (logData: Omit<CommunicationLog, 'id' | 'createdAt'>): Promise<CommunicationLog> => {
        const logs = getStorageItem<CommunicationLog[]>('td_communication_logs', []);
        const newLog: CommunicationLog = {
            ...logData,
            id: Math.random().toString(36).substring(2, 9),
            createdAt: new Date().toISOString()
        };
        logs.unshift(newLog);
        setStorageItem('td_communication_logs', logs);

        // Also add notification for recipient
        await jobsRepository.addNotification(logData.recipientId, {
            title: `New Message from ${logData.senderName}`,
            message: `Subject: ${logData.subject}. View history for details.`,
            type: 'interview_invite'
        });

        return newLog;
    },

    // --- NOTIFICATIONS ---
    getNotifications: async (userId: string): Promise<JobNotification[]> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const actualUserId = user ? user.id : userId;

            const { data: dbNotifs, error } = await supabase
                .from('job_notifications')
                .select('*')
                .eq('user_id', actualUserId)
                .order('created_at', { ascending: false });

            if (!error && dbNotifs && dbNotifs.length > 0) {
                return dbNotifs.map((n: any) => ({
                    id: n.id,
                    title: n.title || '',
                    message: n.message || '',
                    type: n.type || 'app_viewed',
                    isRead: n.is_read || false,
                    createdAt: n.created_at
                }));
            }
        } catch (err) {
            console.error("Failed to load notifications from Supabase, falling back to local storage:", err);
        }
        const allNotifs = getStorageItem<Record<string, JobNotification[]>>('td_notifications_map', {});
        return allNotifs[userId] || [];
    },

    addNotification: async (userId: string, notif: Omit<JobNotification, 'id' | 'isRead' | 'createdAt'>): Promise<JobNotification> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const actualUserId = user ? user.id : userId;

            const dbPayload = {
                user_id: actualUserId,
                title: notif.title,
                message: notif.message,
                type: notif.type,
                is_read: false
            };

            const { data: newDbNotif, error } = await supabase
                .from('job_notifications')
                .insert([dbPayload])
                .select()
                .single();

            if (!error && newDbNotif) {
                return {
                    id: newDbNotif.id,
                    title: newDbNotif.title,
                    message: newDbNotif.message,
                    type: newDbNotif.type as any,
                    isRead: newDbNotif.is_read,
                    createdAt: newDbNotif.created_at
                };
            }
        } catch (err) {
            console.error("Failed to add notification to Supabase, falling back to local storage:", err);
        }

        const allNotifs = getStorageItem<Record<string, JobNotification[]>>('td_notifications_map', {});
        const userNotifs = allNotifs[userId] || [];
        
        const newNotif: JobNotification = {
            ...notif,
            id: Math.random().toString(36).substring(2, 9),
            isRead: false,
            createdAt: new Date().toISOString()
        };

        userNotifs.unshift(newNotif);
        allNotifs[userId] = userNotifs;
        setStorageItem('td_notifications_map', allNotifs);
        return newNotif;
    },

    markNotificationsRead: async (userId: string): Promise<void> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const actualUserId = user ? user.id : userId;

            await supabase
                .from('job_notifications')
                .update({ is_read: true })
                .eq('user_id', actualUserId);
        } catch (err) {
            console.error("Failed to mark notifications read in Supabase:", err);
        }

        const allNotifs = getStorageItem<Record<string, JobNotification[]>>('td_notifications_map', {});
        const userNotifs = allNotifs[userId] || [];
        
        userNotifs.forEach(n => { n.isRead = true; });
        allNotifs[userId] = userNotifs;
        setStorageItem('td_notifications_map', allNotifs);
    },

    // --- SETTINGS (ROLE-SPECIFIC DETAILS) ---
    getTeacherSettings: async (teacherId: string): Promise<TeacherSettings> => {
        const allSettings = getStorageItem<Record<string, TeacherSettings>>('td_teacher_settings_map', {});
        if (!allSettings[teacherId]) {
            allSettings[teacherId] = { ...defaultTeacherSettings };
            setStorageItem('td_teacher_settings_map', allSettings);
        }
        return allSettings[teacherId];
    },

    saveTeacherSettings: async (teacherId: string, settings: Partial<TeacherSettings>): Promise<TeacherSettings> => {
        const allSettings = getStorageItem<Record<string, TeacherSettings>>('td_teacher_settings_map', {});
        const current = allSettings[teacherId] || { ...defaultTeacherSettings };
        const updated = { ...current, ...settings };
        allSettings[teacherId] = updated;
        setStorageItem('td_teacher_settings_map', allSettings);
        return updated;
    },

    getInstitutionSettings: async (instId: string): Promise<InstitutionSettings> => {
        const allSettings = getStorageItem<Record<string, InstitutionSettings>>('td_institution_settings_map', {});
        if (!allSettings[instId]) {
            allSettings[instId] = { ...defaultInstitutionSettings };
            setStorageItem('td_institution_settings_map', allSettings);
        }
        return allSettings[instId];
    },

    saveInstitutionSettings: async (instId: string, settings: Partial<InstitutionSettings>): Promise<InstitutionSettings> => {
        const allSettings = getStorageItem<Record<string, InstitutionSettings>>('td_institution_settings_map', {});
        const current = allSettings[instId] || { ...defaultInstitutionSettings };
        const updated = { ...current, ...settings };
        allSettings[instId] = updated;
        setStorageItem('td_institution_settings_map', allSettings);
        return updated;
    }
};

// --- PRIVATE UTILITIES ---

function calculateResumeStrength(fileName: string, base64: string): number {
    let score = 30; // base score for uploading
    if (fileName.endsWith('.pdf')) score += 10; // premium format points
    if (base64.length > 50000) score += 20; // content volume points
    if (base64.includes('education') || base64.includes('degree') || base64.length > 100000) score += 20; // academic completeness
    if (base64.includes('experience') || base64.includes('work')) score += 20; // career completeness
    return Math.min(score, 100);
}

function calculateMatchScore(job: Job, settings: TeacherSettings): { score: number; details: string[] } {
    let score = 50; // baseline match
    const details: string[] = [];

    // 1. Subject Match (Weight: 20%)
    if (job.subject.toLowerCase() === settings.subjectExpertise.toLowerCase()) {
        score += 20;
        details.push('Subject expertise matches job requirements (+20%)');
    } else {
        score -= 10;
        details.push(`Subject mismatch: Job is ${job.subject}, Profile is ${settings.subjectExpertise} (-10%)`);
    }

    // 2. Experience Match (Weight: 15%)
    if (job.experience.toLowerCase() === settings.experience.toLowerCase()) {
        score += 15;
        details.push('Experience level matches job specifications (+15%)');
    } else {
        score += 5;
        details.push('Experience level partially matches (+5%)');
    }

    // 3. Location Match (Weight: 10%)
    if (job.location.toLowerCase().includes(settings.preferredLocation.toLowerCase()) || 
        settings.preferredLocation.toLowerCase().includes(job.location.toLowerCase())) {
        score += 10;
        details.push('Preferred location matches school location (+10%)');
    }

    // 4. Skills Match (Weight: 25%)
    let skillHits = 0;
    job.skillsRequired.forEach(sk => {
        if (settings.skills.some(userSk => userSk.toLowerCase().includes(sk.toLowerCase()) || sk.toLowerCase().includes(userSk.toLowerCase()))) {
            skillHits++;
        }
    });

    if (job.skillsRequired.length > 0) {
        const ratio = skillHits / job.skillsRequired.length;
        const pts = Math.round(ratio * 25);
        score += pts;
        details.push(`Skills match: Hit ${skillHits} of ${job.skillsRequired.length} required skills (+${pts}%)`);
    } else {
        score += 25;
        details.push('No technical skills specified by job, generic matching applied (+25%)');
    }

    // 5. Qualification Match (Weight: 10%)
    if (settings.qualification.toLowerCase() === job.qualification.toLowerCase() || 
        settings.qualification.includes('M.Ed') && job.qualification.includes('B.Ed')) {
        score += 10;
        details.push('Qualification matches or exceeds required grade (+10%)');
    }

    return {
        score: Math.max(Math.min(score, 100), 0),
        details
    };
}
