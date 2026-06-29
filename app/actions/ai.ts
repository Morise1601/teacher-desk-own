'use server';

import { encryptData, decryptData } from "@/lib/crypto";
import { supabase, supabaseAdmin } from "@/lib/supabase";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

interface Message {
  role: 'user' | 'model';
  content: string;
}

/**
 * SECURE: Verifies if the authenticated user is a teacher and returns their teacher record ID.
 */
async function verifyTeacherUser(userId: string): Promise<string> {
  if (!userId) {
    throw new Error("User session required.");
  }
  
  // Use admin client to query teachers table securely
  const { data: teacher, error } = await supabaseAdmin
    .from('teachers')
    .select('id, is_active, is_deleted')
    .eq('auth_id', userId)
    .maybeSingle();

  if (error || !teacher) {
    throw new Error("Access Denied: Teacher account not found.");
  }

  if (!teacher.is_active || teacher.is_deleted) {
    throw new Error("Access Denied: Teacher account is inactive.");
  }

  return teacher.id;
}

/**
 * Check if the database error is due to a missing table (e.g. DDL migration pending)
 */
function isTableMissingError(error: any): boolean {
  if (!error) return false;
  return (
    error.code === '42P01' || 
    (error.message && error.message.toLowerCase().includes('does not exist'))
  );
}

/**
 * Builds the optimized prompt for the selected feature and fields.
 */
function buildAIPrompt(featureType: string, params: any): string {
  switch (featureType) {
    case 'lesson_plan':
      return `Generate a detailed lesson plan in markdown format.
Subject: ${params.subject || 'General'}
Topic: ${params.topic || 'General Topic'}
Grade/Class: ${params.grade || 'Any'}
Duration: ${params.duration || '45 mins'}
Learning Objectives: ${params.objectives || 'General educational goals'}
Teaching Method: ${params.method || 'Standard instruction'}
Difficulty Level: ${params.difficulty || 'Intermediate'}
Language: ${params.language || 'English'}
Additional Instructions: ${params.instructions || 'None'}

Format the output strictly with these exact markdown headings:
# Lesson Title
## Learning Objectives
## Required Materials
## Introduction
## Teaching Activities
## Classroom Activities
## Assessment
## Homework
## Summary
## Key Takeaways`;

    case 'assignment':
      return `Generate an educational assignment in markdown format.
Subject: ${params.subject || 'General'}
Topic: ${params.topic || 'General Topic'}
Grade/Class: ${params.grade || 'Any'}
Difficulty Level: ${params.difficulty || 'Intermediate'}
Number of Questions: ${params.numQuestions || 5}
Assignment Type: ${params.assignmentType || 'Short Answer'}
Total Marks: ${params.marks || 100}
Time Duration: ${params.duration || '60 mins'}

Format the output strictly with these markdown headings:
# Assignment Title
## Instructions
## Questions
## Answer Guidelines
## Evaluation Criteria`;

    case 'quiz':
      return `Generate a school quiz in markdown format.
Subject: ${params.subject || 'General'}
Topic: ${params.topic || 'General Topic'}
Grade/Class: ${params.grade || 'Any'}
Difficulty Level: ${params.difficulty || 'Intermediate'}
Number of Questions: ${params.numQuestions || 5}

Format the output strictly with these markdown headings:
# Quiz Title
## Questions
(Provide multiple choice questions with A, B, C, D options)
## Answer Key & Explanations
(Clearly indicate the correct option and brief explanation for each question)`;

    case 'announcement':
      return `Generate a professional school announcement in markdown format suitable for posting.
Topic: ${params.topic || 'General announcement'}
Purpose: ${params.purpose || 'Informational'}
Tone: ${params.tone || 'Professional'}
Audience: ${params.audience || 'Students and Parents'}

Format the output strictly with:
# Announcement Title
## Message Body
## Key Details
(Provide date, time, location, or actionable instructions if applicable)`;

    case 'summary':
      return `Generate a clear educational summary in markdown format.
Text / Topic: ${params.content || 'Educational content'}
Length: ${params.length || 'Medium'}

Format the output strictly with:
# Summary Title
## Concise Summary
## Key Concepts
## Bullet Points
## Revision Notes`;

    case 'notes':
      return `Generate comprehensive, structured class notes in markdown format.
Subject: ${params.subject || 'General'}
Topic: ${params.topic || 'General Topic'}
Grade: ${params.grade || 'Any'}

Format the output strictly with:
# Notes Title
## Introduction
## Core Headings & Concepts
## Structured Explanations (with bullet points)
## Practical Examples
## Revision Tips`;

    case 'study_material':
      return `Generate a comprehensive study material booklet in markdown format.
Subject: ${params.subject || 'General'}
Topic: ${params.topic || 'General Topic'}
Grade/Class: ${params.grade || 'Any'}
Difficulty Level: ${params.difficulty || 'Intermediate'}

Format the output strictly with:
# Study Material Title
## Introduction
## Detailed Concepts & Theories
## Worked Examples
## Diagrams Placeholder
(Provide a description of a diagram that should be shown here)
## Practice Exercises
## References
## Revision Tips`;

    default:
      return `Generate educational content about: ${params.topic || 'Education'}`;
  }
}

/**
 * SECURE ACTION: Generates content via Gemini API or mock fallback, keeping keys secret.
 */
export async function generateAIContentAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload || !payload.userId) {
      throw new Error("Invalid session.");
    }

    const { userId, featureType, params, history = [] } = payload;
    const teacherId = await verifyTeacherUser(userId);

    let systemPrompt = "You are an expert AI teaching assistant for school teachers. Return output in valid GitHub-flavored Markdown. Do not include markdown code block wraps (like ```markdown ... ```) around the entire output. Just return the raw markdown content directly.";
    
    // Construct request contents
    let requestContents: any[] = [];

    if (history.length === 0) {
      const generatedPrompt = buildAIPrompt(featureType, params);
      requestContents.push({
        role: 'user',
        parts: [{ text: generatedPrompt }]
      });
    } else {
      // Map history to Gemini API format
      history.forEach((msg: Message) => {
        requestContents.push({
          role: msg.role,
          parts: [{ text: msg.content }]
        });
      });
    }

    let generatedText = '';
    let isMock = false;

    if (!GEMINI_API_KEY) {
      console.warn("⚠️ GEMINI_API_KEY is not defined in environment variables. Falling back to sandbox mock generator.");
      isMock = true;
      generatedText = getMockResponse(featureType, params, history);
    } else {
      // Perform Gemini API Call
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      
      const requestBody = {
        contents: requestContents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      };

      const apiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error("❌ Gemini API returned error status:", apiResponse.status, errorText);
        throw new Error(`AI generation failed: API returned status ${apiResponse.status}`);
      }

      const json = await apiResponse.json();
      generatedText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!generatedText) {
        throw new Error("AI returned an empty response.");
      }
    }

    // Save statistics in DB if table exists (async, fail-silent)
    try {
      await supabaseAdmin.from('ai_usage_statistics').insert({
        teacher_id: teacherId,
        feature_type: featureType,
        prompt: history[history.length - 1]?.content || buildAIPrompt(featureType, params)
      });
    } catch (e) {
      // Fail silently if stats table missing
    }

    return encryptData({
      success: true,
      content: generatedText,
      isMock
    });

  } catch (error: any) {
    console.error("❌ [generateAIContentAction error]:", error.message);
    return encryptData({
      success: false,
      message: error.message || "An error occurred during content generation."
    });
  }
}

/**
 * SECURE ACTION: Fetches AI generation history for the logged-in teacher.
 */
export async function getAIHistoryAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload || !payload.userId) throw new Error("Unauthorized.");

    const teacherId = await verifyTeacherUser(payload.userId);

    const { data, error } = await supabaseAdmin
      .from('ai_history')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      if (isTableMissingError(error)) {
        return encryptData({ success: true, isFallback: true, data: [] });
      }
      throw error;
    }

    return encryptData({ success: true, data });
  } catch (error: any) {
    console.error("❌ [getAIHistoryAction error]:", error.message);
    return encryptData({ success: false, message: error.message });
  }
}

/**
 * SECURE ACTION: Saves generated content in the history.
 */
export async function saveAIHistoryAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload || !payload.userId) throw new Error("Unauthorized.");

    const teacherId = await verifyTeacherUser(payload.userId);
    const { featureType, params, generatedContent } = payload;

    const { data, error } = await supabaseAdmin
      .from('ai_history')
      .insert({
        teacher_id: teacherId,
        feature_type: featureType,
        input_parameters: params,
        generated_content: generatedContent
      })
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        return encryptData({ success: true, isFallback: true });
      }
      throw error;
    }

    return encryptData({ success: true, data });
  } catch (error: any) {
    console.error("❌ [saveAIHistoryAction error]:", error.message);
    return encryptData({ success: false, message: error.message });
  }
}

/**
 * SECURE ACTION: Deletes a record from the history.
 */
export async function deleteAIHistoryAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload || !payload.userId || !payload.id) throw new Error("Invalid request.");

    const teacherId = await verifyTeacherUser(payload.userId);

    const { error } = await supabaseAdmin
      .from('ai_history')
      .delete()
      .eq('id', payload.id)
      .eq('teacher_id', teacherId);

    if (error) {
      if (isTableMissingError(error)) {
        return encryptData({ success: true, isFallback: true });
      }
      throw error;
    }

    return encryptData({ success: true });
  } catch (error: any) {
    console.error("❌ [deleteAIHistoryAction error]:", error.message);
    return encryptData({ success: false, message: error.message });
  }
}

/**
 * SECURE ACTION: Fetches saved AI content (favorites & desk saves).
 */
export async function getAISavedContentAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload || !payload.userId) throw new Error("Unauthorized.");

    const teacherId = await verifyTeacherUser(payload.userId);

    const { data, error } = await supabaseAdmin
      .from('ai_saved_content')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      if (isTableMissingError(error)) {
        return encryptData({ success: true, isFallback: true, data: [] });
      }
      throw error;
    }

    return encryptData({ success: true, data });
  } catch (error: any) {
    console.error("❌ [getAISavedContentAction error]:", error.message);
    return encryptData({ success: false, message: error.message });
  }
}

/**
 * SECURE ACTION: Creates or updates saved AI content.
 */
export async function saveAIContentAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload || !payload.userId) throw new Error("Unauthorized.");

    const teacherId = await verifyTeacherUser(payload.userId);
    const { title, featureType, content, isFavorite = false, id } = payload;

    let result;
    if (id) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('ai_saved_content')
        .update({
          title,
          content,
          is_favorite: isFavorite,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('teacher_id', teacherId)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await supabaseAdmin
        .from('ai_saved_content')
        .insert({
          teacher_id: teacherId,
          title,
          feature_type: featureType,
          content,
          is_favorite: isFavorite
        })
        .select()
        .single();
      
      if (error) {
        if (isTableMissingError(error)) {
          return encryptData({ success: true, isFallback: true });
        }
        throw error;
      }
      result = data;
    }

    return encryptData({ success: true, data: result });
  } catch (error: any) {
    console.error("❌ [saveAIContentAction error]:", error.message);
    return encryptData({ success: false, message: error.message });
  }
}

/**
 * SECURE ACTION: Toggle favorite status of a saved item.
 */
export async function toggleAIFavoriteAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload || !payload.userId || !payload.id) throw new Error("Invalid request.");

    const teacherId = await verifyTeacherUser(payload.userId);
    const { isFavorite } = payload;

    const { data, error } = await supabaseAdmin
      .from('ai_saved_content')
      .update({ is_favorite: isFavorite })
      .eq('id', payload.id)
      .eq('teacher_id', teacherId)
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        return encryptData({ success: true, isFallback: true });
      }
      throw error;
    }

    return encryptData({ success: true, data });
  } catch (error: any) {
    console.error("❌ [toggleAIFavoriteAction error]:", error.message);
    return encryptData({ success: false, message: error.message });
  }
}

/**
 * SECURE ACTION: Deletes a saved content record.
 */
export async function deleteAISavedContentAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload || !payload.userId || !payload.id) throw new Error("Invalid request.");

    const teacherId = await verifyTeacherUser(payload.userId);

    const { error } = await supabaseAdmin
      .from('ai_saved_content')
      .delete()
      .eq('id', payload.id)
      .eq('teacher_id', teacherId);

    if (error) {
      if (isTableMissingError(error)) {
        return encryptData({ success: true, isFallback: true });
      }
      throw error;
    }

    return encryptData({ success: true });
  } catch (error: any) {
    console.error("❌ [deleteAISavedContentAction error]:", error.message);
    return encryptData({ success: false, message: error.message });
  }
}

/**
 * SECURE ACTION: Fetches both system and user templates.
 */
export async function getAITemplatesAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload || !payload.userId) throw new Error("Unauthorized.");

    const teacherId = await verifyTeacherUser(payload.userId);

    const { data, error } = await supabaseAdmin
      .from('ai_templates')
      .select('*')
      .or(`is_system.eq.true,teacher_id.eq.${teacherId}`)
      .order('created_at', { ascending: false });

    if (error) {
      if (isTableMissingError(error)) {
        return encryptData({ success: true, isFallback: true, data: getStaticSystemTemplates() });
      }
      throw error;
    }

    return encryptData({ success: true, data });
  } catch (error: any) {
    console.error("❌ [getAITemplatesAction error]:", error.message);
    return encryptData({ success: false, message: error.message });
  }
}

/**
 * SECURE ACTION: Saves a new template for the user.
 */
export async function saveAITemplateAction(encryptedPayload: string) {
  try {
    const payload = decryptData(encryptedPayload);
    if (!payload || !payload.userId) throw new Error("Unauthorized.");

    const teacherId = await verifyTeacherUser(payload.userId);
    const { title, description, featureType, params } = payload;

    const { data, error } = await supabaseAdmin
      .from('ai_templates')
      .insert({
        teacher_id: teacherId,
        title,
        description,
        feature_type: featureType,
        input_parameters: params,
        is_system: false
      })
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        return encryptData({ success: true, isFallback: true });
      }
      throw error;
    }

    return encryptData({ success: true, data });
  } catch (error: any) {
    console.error("❌ [saveAITemplateAction error]:", error.message);
    return encryptData({ success: false, message: error.message });
  }
}

/**
 * Fallback static templates if DB not yet updated
 */
function getStaticSystemTemplates() {
  return [
    {
      id: 'static-template-1',
      title: 'Science Lesson: Intro to Gravity',
      description: 'A beginner-friendly lesson plan for gravity.',
      feature_type: 'lesson_plan',
      input_parameters: {
        subject: "Science",
        topic: "Introduction to Gravity",
        grade: "Grade 7",
        duration: "45 mins",
        objectives: "Understand gravitational force and acceleration",
        method: "Lecture & Experiments",
        difficulty: "Beginner",
        language: "English",
        instructions: "Include simple household materials"
      },
      is_system: true
    },
    {
      id: 'static-template-2',
      title: 'Mathematics Quiz: Quadratic Equations',
      description: 'Quiz template with MCQs for quadratic equations.',
      feature_type: 'quiz',
      input_parameters: {
        subject: "Mathematics",
        topic: "Quadratic Equations",
        grade: "Grade 10",
        difficulty: "Intermediate",
        numQuestions: 5
      },
      is_system: true
    },
    {
      id: 'static-template-3',
      title: 'English Assignment: Creative Writing',
      description: 'Creative descriptive writing assignment criteria.',
      feature_type: 'assignment',
      input_parameters: {
        subject: "English",
        topic: "Creative Descriptive Writing",
        grade: "Grade 9",
        difficulty: "Intermediate",
        numQuestions: 1,
        assignmentType: "Short Answer",
        marks: 20,
        duration: "30 mins"
      },
      is_system: true
    },
    {
      id: 'static-template-4',
      title: 'Parent-Teacher Meeting Notice',
      description: 'Notice announcing conferences.',
      feature_type: 'announcement',
      input_parameters: {
        topic: "Parent-Teacher Meeting",
        purpose: "Discuss Term 1 Progress",
        tone: "Professional",
        audience: "Parents"
      },
      is_system: true
    }
  ];
}

/**
 * Returns mock responses based on inputs when GEMINI_API_KEY is not defined.
 */
function getMockResponse(featureType: string, params: any, history: Message[]): string {
  const isFollowup = history.length > 1;
  if (isFollowup) {
    const latestQuery = history[history.length - 1].content;
    return `### Refined Content Output (Sandbox Mock Mode)

You requested: *"${latestQuery}"*

Here is the updated educational content according to your feedback:

*   **Adjustment Applied:** Streamlined structure, adjusted depth, and added clarifying bullet points.
*   **Original topic:** ${params.topic || 'Educational Topic'}
*   **Original grade:** ${params.grade || 'General'}

#### Updated Core Material

1.  **Refined Concept Explanation:** We have optimized the explanations to match your specific instructions.
2.  **Simplified Definition:** Important terms have been highlighted and broken down into simple, intuitive sentences.
3.  **New Exercises:** Additional review items are included below to reinforce student comprehension.

> [!NOTE]
> This is a simulated refinement response. Adding a \`GEMINI_API_KEY\` to your \`.env.local\` file will enable real, dynamic multi-turn AI chat interactions.`;
  }

  const topic = params.topic || 'General Topic';
  const subject = params.subject || 'General';
  const grade = params.grade || 'Any';
  const diff = params.difficulty || 'Intermediate';

  switch (featureType) {
    case 'lesson_plan':
      return `# Lesson Plan: ${topic}
## Learning Objectives
* Students will be able to define key principles of ${topic} in the context of ${subject}.
* Students will execute practical examples to apply their knowledge.
* Students will complete a short self-assessment.

## Required Materials
* Blackboard / Whiteboard and markers.
* Handouts with diagrams illustrating ${topic}.
* Worksheets for individual classroom practice.

## Introduction (10 Minutes)
* Hook: Begin with an intriguing question relating to ${topic} in daily life.
* Direct Instruction: Outline the agenda for today's lesson.

## Teaching Activities (20 Minutes)
* Explain the foundational rules of ${topic}.
* Walk through 3 graded examples: Beginner level, Intermediate level, and one Advanced application.

## Classroom Activities (10 Minutes)
* Peer Collaboration: Have students pair up to solve 2 worksheets of increasing difficulty.
* Teacher reviews progress, stopping at desks to assist students who require extra guidance.

## Assessment
* A 3-question exit ticket to gauge understanding before the bell rings.

## Homework
* Read Chapter 4 of the textbook.
* Complete exercises 1-5 on page 42.

## Summary
* Reiterate that ${topic} forms a cornerstone of ${subject} that will be expanded upon in future lessons.

## Key Takeaways
* Foundational concepts must be mastered first.
* Consistent practice is required to build speed and accuracy.`;

    case 'assignment':
      return `# Assignment: ${topic} (${subject})
## Instructions
* Please read all questions carefully before writing your answers.
* Answer all sections in the space provided.
* Show all steps of your work where applicable.
* **Duration:** ${params.duration || '60 mins'} | **Total Marks:** ${params.marks || 50}

## Questions
1.  **Question 1 (10 Marks):** Explain the core concept of ${topic} and list its three main properties.
2.  **Question 2 (15 Marks):** Compare and contrast ${topic} with its corresponding concepts. Provide a real-world scenario.
3.  **Question 3 (25 Marks):** Analytical Problem-Solving: Write a detailed critique/response of a practical study focusing on ${topic}.

## Answer Guidelines
*   **Q1 Guideline:** Expecting a definition focusing on core properties. Full marks require naming all 3 properties accurately.
*   **Q2 Guideline:** The student should display a clear table or comparison bullets. A realistic example is required.
*   **Q3 Guideline:** Rubric looks for structured analysis, logical reasoning, and identification of variables.

## Evaluation Criteria
*   **Concept Accuracy:** 40%
*   **Scenario Applicability:** 30%
*   **Clarity and Structure:** 20%
*   **Spelling and Grammar:** 10%`;

    case 'quiz':
      return `# Quiz: ${topic}
## Questions
1.  **What is the primary feature of ${topic}?**
    *   (A) Option A
    *   (B) Option B
    *   (C) Option C
    *   (D) Option D
2.  **Which of the following best exemplifies ${topic} in action?**
    *   (A) Option A
    *   (B) Option B
    *   (C) Option C
    *   (D) Option D
3.  **In which scenario is ${topic} most applicable?**
    *   (A) Option A
    *   (B) Option B
    *   (C) Option C
    *   (D) Option D

## Answer Key & Explanations
1.  **Correct Answer: B**
    *   *Explanation:* Option B is correct because the foundational rule states that ${topic} interacts directly with key parameters.
2.  **Correct Answer: A**
    *   *Explanation:* Option A provides the most realistic, textbook demonstration of these principles.
3.  **Correct Answer: C**
    *   *Explanation:* In high-density settings, Option C resolves the structural problem most efficiently.`;

    case 'announcement':
      return `# Announcement: Update on ${topic}
## Message Body
Dear Students and Parents,

Please be informed that we will be launching our new curriculum unit on **${topic}** starting next week. This unit is critical for establishing a strong foundation in **${subject}** for ${grade}. 

We encourage all students to preview their reading material and come prepared with questions.

## Key Details
*   **Start Date:** Next Monday
*   **Required Material:** Textbook Chapter 3
*   **Note for Parents:** Please sign the progress slips sent home today.
*   **Contact:** For any questions, please reach out via the TeacherDesk portal.`;

    case 'summary':
      return `# Summary: ${topic}
## Concise Summary
This document provides a distilled overview of ${topic}. It breaks down the primary theories, structures, and conclusions essential for school examinations.

## Key Concepts
* Distilled point A: The core theoretical element.
* Distilled point B: Practical application vectors.
* Distilled point C: Formulas or logical deductions.

## Bullet Points
* Primary definition of terms.
* Historical context and background.
* Common misunderstandings and how to avoid them.

## Revision Notes
* Remember to study the diagram labels.
* Practice the short-answer questions at the end of the chapter.`;

    case 'notes':
      return `# Class Notes: ${topic} (${grade})
## Introduction
Welcome to your revision notes for ${topic}. These notes summarize the lectures and classroom discussion on this core ${subject} topic.

## Core Headings & Concepts
### 1. Fundamentals of ${topic}
* Key Rule 1: Always check units before performing computations.
* Key Rule 2: Note the relationship between the independent and dependent variables.

### 2. Practical Frameworks
* Method A: Used for quick calculations and estimations.
* Method B: Required for formal reporting and exact results.

## Practical Examples
* *Example 1:* If variable X increases, explain the impact on ${topic}.
* *Solution:* According to the rule, they are directly proportional.

## Revision Tips
* Draw the flowcharts three times to cement memory.
* Focus on understanding the relationships rather than rote memorization.`;

    case 'study_material':
      return `# Study Guide: Master ${topic}
## Introduction
This study booklet is designed to guide ${grade} students through the intermediate concepts of ${topic}.

## Detailed Concepts & Theories
*   **Theory A:** Detailed explanation of the primary rules.
*   **Theory B:** How these rules interact with larger systems in ${subject}.

## Worked Examples
*   *Problem:* Calculate the coefficient of ${topic} under standard classroom constraints.
*   *Step-by-step Solution:* 
    1. List known variables.
    2. Write down formulas.
    3. Plug in the values and calculate the final result.

## Diagrams Placeholder
*   **Figure 1.1:** Schematic diagram representing the interaction of variables in ${topic}. The flowchart should map inputs, processes, and final outputs clearly.

## Practice Exercises
1. Test your understanding: Explain how the variables shift under extreme conditions.
2. Multiple choice practice items.

## References
* High School ${subject} Curriculum Guide.
* Online Interactive Science/Math Portal.

## Revision Tips
* Re-run calculations at least twice.
* Practice explaining these concepts to a classmate.`;

    default:
      return `# Generated Content: ${topic}`;
  }
}
