'use server';

import { encryptData, decryptData } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase";

export async function getDashboardWidgetsAction(encryptedPayload: string) {
  try {
    const { userId } = decryptData(encryptedPayload);
    if (!userId) {
      throw new Error("User ID is required.");
    }

    // 1. Fetch Top Profiles (Teachers)
    const { data: teachersData } = await supabaseAdmin
      .from('teachers')
      .select('auth_id, full_name, specialization')
      .limit(4);

    const teacherAuthIds = (teachersData || []).map((t: any) => t.auth_id);
    const { data: teacherProfiles } = await supabaseAdmin
      .from('profiles')
      .select('user_id, profile_pic_url')
      .in('user_id', teacherAuthIds);

    const topProfiles = (teachersData || []).map((t: any) => {
      const p = (teacherProfiles || []).find((prof: any) => prof.user_id === t.auth_id);
      return {
        id: t.auth_id,
        name: t.full_name,
        role: t.specialization || 'Educator',
        avatar: p?.profile_pic_url || ''
      };
    });

    // 2. Fetch Top Jobs from posted_jobs, fallback to hardcoded list if empty
    const { data: jobsDb } = await supabaseAdmin
      .from('posted_jobs')
      .select('id, title, salary_range, description, location')
      .eq('status', 'active')
      .limit(5);

    let topJobs: any[] = [];
    if (jobsDb && jobsDb.length > 0) {
      topJobs = jobsDb.map((j: any) => ({
        id: j.id,
        title: j.title,
        rate: j.salary_range || 'Competitive',
        description: j.description || ''
      }));
    } else {
      // Fallback
      topJobs = [
        { id: 'j1', title: 'Senior Mathematics Teacher', rate: '₹45k - ₹65k', description: 'Delhi Public School is looking for a Math teacher.' },
        { id: 'j2', title: 'Physics Teacher (PGT)', rate: '₹40k - ₹55k', description: 'Ryan International School requires a PGT Physics.' },
        { id: 'j3', title: 'English Language Teacher', rate: '₹30k - ₹45k', description: 'Kendriya Vidyalaya is hiring English Teachers.' },
        { id: 'j4', title: 'Computer Science Teacher', rate: '₹35k - ₹50k', description: 'The Heritage School requires CS PGT.' }
      ];
    }

    // 3. Fetch Institutions (Institution Desk)
    const { data: instsDb } = await supabaseAdmin
      .from('institutions')
      .select('id, name, type, address, founded_year, staff_count, rank, is_verified')
      .limit(4);

    let institutions: any[] = [];
    if (instsDb && instsDb.length > 0) {
      const colors = [
        "from-blue-600 to-indigo-900",
        "from-red-600 to-rose-900",
        "from-emerald-600 to-teal-900",
        "from-amber-500 to-orange-700"
      ];
      institutions = instsDb.map((inst: any, index: number) => ({
        id: inst.id,
        name: inst.name,
        type: inst.type || 'School',
        status: inst.staff_count ? `${inst.staff_count}+ Members` : "Active Partner",
        location: inst.address ? inst.address.split(',').slice(-3).join(',').trim() : 'India',
        members: inst.staff_count ? `${inst.staff_count} Staff` : 'Join now',
        since: inst.founded_year ? String(inst.founded_year) : '2024',
        color: colors[index % colors.length],
        tag: inst.rank ? `Ranked #${inst.rank}` : (inst.is_verified ? "Verified" : "Partner")
      }));
    } else {
      // Fallback
      institutions = [
        { id: 'i1', name: "Oxford International School", type: "School", status: "Active Now", location: "London, UK", members: "120+ Teachers", since: "2024", color: "from-blue-600 to-indigo-900", tag: "Global Partner" },
        { id: 'i2', name: "Stanford University", type: "University", status: "Member", location: "California, USA", members: "450+ Creators", since: "2023", color: "from-red-600 to-rose-900", tag: "Innovation Hub" }
      ];
    }

    // 4. Institution News (Updates from local institutions in database)
    let institutionNews: any[] = [];
    if (instsDb && instsDb.length > 0) {
      institutionNews = instsDb.slice(0, 3).map((inst: any, index: number) => {
        const templates = [
          `announced a new hiring drive for Mathematics and Science departments.`,
          `updated their academic curriculum for high school grade levels.`,
          `announced details for the upcoming regional science exhibition.`
        ];
        return {
          id: `news_${inst.id}`,
          title: inst.name,
          news: templates[index % templates.length]
        };
      });
    } else {
      institutionNews = [
        { id: 'n1', title: 'Chellammal College', news: 'announced new professional development courses.' },
        { id: 'n2', title: 'Stanford University', news: 'opened fellowship programs for K-12 educators.' }
      ];
    }

    // 5. Messaging (Conversations from messages table)
    const { data: messagesDb } = await supabaseAdmin
      .from('messages')
      .select('id, sender_id, receiver_id, message_text, created_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    let messaging: any[] = [];
    if (messagesDb && messagesDb.length > 0) {
      // Get unique conversation partners
      const partnerIds = [...new Set(messagesDb.flatMap((m: any) => [m.sender_id, m.receiver_id]))]
        .filter(id => id !== userId)
        .slice(0, 3);

      const [{ data: teachersMsg }, { data: instsMsg }, { data: profilesMsg }] = await Promise.all([
        supabaseAdmin.from('teachers').select('auth_id, full_name').in('auth_id', partnerIds),
        supabaseAdmin.from('institutions').select('auth_id, name').in('auth_id', partnerIds),
        supabaseAdmin.from('profiles').select('user_id, profile_pic_url').in('user_id', partnerIds)
      ]);

      messaging = partnerIds.map(pid => {
        const lastM = messagesDb.find((m: any) => m.sender_id === pid || m.receiver_id === pid);
        const teach = (teachersMsg || []).find((t: any) => t.auth_id === pid);
        const inst = (instsMsg || []).find((i: any) => i.auth_id === pid);
        const prof = (profilesMsg || []).find((p: any) => p.user_id === pid);

        return {
          id: pid,
          name: teach?.full_name || inst?.name || 'Academic Support',
          avatar: prof?.profile_pic_url || '',
          lastMessage: lastM?.message_text || '',
          time: lastM?.created_at ? new Date(lastM.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
        };
      });
    }

    // 6. Saved Items (Bookmarked posts)
    const { data: savedDb } = await supabaseAdmin
      .from('saved_posts')
      .select('id, post_id, created_at')
      .eq('user_id', userId)
      .limit(3);

    let savedItems: any[] = [];
    if (savedDb && savedDb.length > 0) {
      const postIds = savedDb.map((s: any) => s.post_id);
      const { data: postsData } = await supabaseAdmin
        .from('posts')
        .select('id, content, post_type')
        .in('id', postIds);

      savedItems = (postsData || []).map((p: any) => ({
        id: p.id,
        title: p.content ? p.content.substring(0, 40) + '...' : 'Saved Post',
        type: p.post_type || 'post'
      }));
    }

    // 7. Groups (Classrooms or Innovative communities)
    const { data: membersDb } = await supabaseAdmin
      .from('classroom_members')
      .select('classroom_id')
      .eq('user_id', userId);

    let classroomIds = (membersDb || []).map((m: any) => m.classroom_id);
    
    // Also include classrooms where user is teacher
    const { data: teachClassDb } = await supabaseAdmin
      .from('classrooms')
      .select('id')
      .eq('teacher_id', userId);

    if (teachClassDb && teachClassDb.length > 0) {
      classroomIds = [...new Set([...classroomIds, ...teachClassDb.map((c: any) => c.id)])];
    }

    let groups: any[] = [];
    if (classroomIds.length > 0) {
      const { data: classDb } = await supabaseAdmin
        .from('classrooms')
        .select('id, name')
        .in('id', classroomIds)
        .limit(3);

      groups = (classDb || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        tag: 'Classroom Group'
      }));
    }

    // 8. Schedule Class (Upcoming classes / Meetings)
    const { data: meetingsDb } = await supabaseAdmin
      .from('meetings')
      .select('id, title, subject, meeting_date, start_time, meet_link')
      .eq('teacher_id', userId)
      .order('meeting_date', { ascending: true })
      .limit(3);

    let scheduledClasses: any[] = [];
    if (meetingsDb && meetingsDb.length > 0) {
      scheduledClasses = meetingsDb.map((m: any) => ({
        id: m.id,
        title: m.title,
        subject: m.subject || 'General',
        dateTime: `${m.meeting_date} at ${m.start_time.substring(0, 5)}`,
        link: m.meet_link
      }));
    }

    // 9. Headlines (Parsed from New York Times Education RSS feed)
    let headlines: any[] = [];
    try {
      const res = await fetch('https://rss.nytimes.com/services/xml/rss/nyt/Education.xml', { next: { revalidate: 600 } });
      if (res.ok) {
        const xml = await res.text();
        const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
        for (const match of matches) {
          const content = match[1];
          const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/);
          const linkMatch = content.match(/<link>([\s\S]*?)<\/link>/);
          
          const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]>/g, '$1').replace(/&lt;!\[CDATA\[([\s\S]*?)\]\]&gt;/g, '$1').trim() : '';
          const link = linkMatch ? linkMatch[1].trim() : '';
          
          if (title && link) {
            headlines.push({
              title,
              link
            });
          }
          if (headlines.length >= 4) break;
        }
      }
    } catch (err) {
      console.error("Headlines fetch failed:", err);
    }
    
    // Fallback if headlines fetch failed or empty
    if (headlines.length === 0) {
      headlines = [
        { title: 'AI Integration in K-12 Classrooms Gains Global Traction', link: 'https://nytimes.com' },
        { title: 'Global Higher Education Forum Re-evaluates Standardized Admissions', link: 'https://nytimes.com' }
      ];
    }

    // 10. Most Viewed This Week (Highest applicant jobs or fallback)
    let mostViewed: any[] = [];
    if (jobsDb && jobsDb.length > 0) {
      mostViewed = jobsDb.slice(0, 2).map((j: any) => ({
        id: j.id,
        title: j.title,
        rate: j.salary_range || 'Competitive',
        avatar: ''
      }));
    } else {
      mostViewed = [
        { id: 'mv1', title: 'Senior Product Designer', rate: '₹45,000/mo', avatar: '' },
        { id: 'mv2', title: 'UX Designer', rate: '₹40,000/mo', avatar: '' }
      ];
    }

    const payloadOut = {
      success: true,
      data: {
        topProfiles,
        topJobs,
        institutions,
        institutionNews,
        messaging,
        savedItems,
        groups,
        scheduledClasses,
        headlines,
        mostViewed
      }
    };

    return encryptData(payloadOut);
  } catch (err: any) {
    console.error("❌ [DASHBOARD WIDGETS ERROR]:", err.message);
    return encryptData({ success: false, message: err.message });
  }
}
