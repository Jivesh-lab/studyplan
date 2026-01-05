/**
 * COMPLETE SETUP SCRIPT
 * 
 * This script:
 * 1. Clears all old data
 * 2. Creates user profile
 * 3. Creates 30-day study plan
 * 4. Creates test weakness (20% completion)
 * 
 * Run in Console: F12 → Console tab → Paste this → Enter
 */

(function() {
  console.log("🚀 Starting complete setup...");
  
  // STEP 1: Clear all old data
  localStorage.clear();
  console.log("✅ Step 1: Cleared old data");

  // STEP 2: Create user profile
  const userProfile = {
    name: "John Doe",
    course: "12th Grade",
    dailyHours: 3,
    studyTime: "Morning",
    subjects: [
      { name: "English", skill: "Medium", units: "Unit 1, Unit 2, Unit 3, Unit 4" },
      { name: "Math", skill: "Beginner", units: "Algebra, Geometry, Calculus" },
      { name: "Science", skill: "Advanced", units: "Physics, Chemistry, Biology" }
    ]
  };
  
  localStorage.setItem('userProfile', JSON.stringify(userProfile));
  console.log("✅ Step 2: Created user profile with 3 subjects");

  // STEP 3: Create initial 30-day study plan
  const studyPlan = [];
  const today = new Date();
  let taskId = 1;

  for (let day = 0; day < 30; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    const dateString = date.toISOString().split('T')[0];
    
    // Rotate subjects
    const subjects = userProfile.subjects;
    
    for (let hour = 0; hour < 3; hour++) { // 3 hours per day
      const subjectIndex = (day + hour) % subjects.length;
      const subject = subjects[subjectIndex];
      
      studyPlan.push({
        id: `task-${taskId}`,
        date: dateString,
        subject: subject.name,
        unit: `Unit ${(day % 4) + 1}`,
        startTime: 8 + hour,
        duration: 1,
        status: "Pending"
      });
      
      taskId++;
    }
  }

  // STEP 4: Override English subject for test weakness
  console.log("📊 Creating test weakness for English...");
  
  let englishCount = 0;
  studyPlan.forEach((task, index) => {
    if (task.subject === 'English') {
      englishCount++;
      
      if (englishCount <= 2) {
        task.status = 'Completed';
      } else if (englishCount <= 8) {
        task.status = 'Missed';
      }
      // Rest stay as Pending
    }
  });

  localStorage.setItem('studyPlan', JSON.stringify(studyPlan));
  console.log("✅ Step 3: Created 30-day plan (90 tasks total)");
  
  // STEP 5: Create streak and achievements
  localStorage.setItem('studyStreak', JSON.stringify({ current: 0, lastCompletedDate: null }));
  localStorage.setItem('achievements', JSON.stringify([]));
  console.log("✅ Step 4: Created streak and achievements");

  // FINAL SUMMARY
  console.log("");
  console.log("✅ SETUP COMPLETE!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 User: John Doe (12th Grade)");
  console.log("📚 Subjects: English, Math, Science");
  console.log("📅 Study Plan: 30 days (90 tasks)");
  console.log("");
  console.log("🔥 Test Weakness Created:");
  console.log("   Subject: English");
  console.log("   Completed: 2 tasks");
  console.log("   Missed: 6 tasks");
  console.log("   Pending: Remaining");
  console.log("   Completion: ~20% (WEAK!)");
  console.log("");
  console.log("🔄 Page will refresh in 3 seconds...");
  
  setTimeout(() => {
    location.reload();
  }, 3000);
})();
