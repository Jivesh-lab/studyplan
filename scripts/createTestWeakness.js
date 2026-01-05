/**
 * Test Script: Create Weakness Scenario
 * 
 * This script adds test tasks to your study plan with intentional weak subjects
 * Run this in the browser console to test the Weakness Action Card feature
 * 
 * Usage in Browser Console:
 * 1. Open DevTools (F12)
 * 2. Go to Console tab
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Refresh the page (F5)
 * 6. Go to Progress/Analytics tab
 */

(function() {
  console.log('🚀 Creating test weakness scenario...');

  // Get current data
  const userProfile = JSON.parse(localStorage.getItem('userProfile'));
  const currentPlan = JSON.parse(localStorage.getItem('studyPlan')) || [];

  if (!userProfile || !userProfile.subjects) {
    console.error('❌ No user profile found. Please complete onboarding first!');
    return;
  }

  console.log('📋 Current subjects:', userProfile.subjects.map(s => s.name));

  // Create test scenario: Make first subject weak
  const targetSubject = userProfile.subjects[0]?.name;
  if (!targetSubject) {
    console.error('❌ No subjects found in profile');
    return;
  }

  // Remove old test tasks for this subject
  const filteredPlan = currentPlan.filter(t => t.subject !== targetSubject);

  // Create 10 test tasks for the subject
  const testTasks = [];
  const today = new Date();
  
  for (let i = 0; i < 10; i++) {
    const taskDate = new Date(today);
    taskDate.setDate(today.getDate() + Math.floor(i / 3)); // Spread across days
    const dateString = taskDate.toISOString().split('T')[0];
    
    const statuses = ['Completed', 'Completed', 'Missed', 'Missed', 'Missed', 'Missed', 'Missed', 'Missed', 'Pending', 'Pending'];
    
    testTasks.push({
      id: `test-${targetSubject}-${i}`,
      date: dateString,
      subject: targetSubject,
      unit: `Test Unit ${i + 1}`,
      startTime: 8 + (i % 3),
      duration: 1,
      status: statuses[i],
      isTestTask: true
    });
  }

  // Combine: new test tasks + old other subjects
  const newPlan = [...filteredPlan, ...testTasks];

  // Save to localStorage
  localStorage.setItem('studyPlan', JSON.stringify(newPlan));

  // Log results
  console.log('✅ Test tasks created!');
  console.log(`📊 ${targetSubject} test data:`);
  console.log(`   - Total tasks: 10`);
  console.log(`   - Completed: 2 (20%)`);
  console.log(`   - Missed: 6 (60%)`);
  console.log(`   - Pending: 2 (20%)`);
  console.log(`   - Result: WEAK SUBJECT ⚠️ (20% < 50%)`);
  console.log('');
  console.log('🔄 Refreshing page in 2 seconds...');
  
  setTimeout(() => {
    location.reload();
  }, 2000);
})();
