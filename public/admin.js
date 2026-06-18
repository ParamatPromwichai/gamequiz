document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('qForm');
  const qList = document.getElementById('qList');
  const qCount = document.getElementById('qCount');
  const btnCancel = document.getElementById('btnCancel');
  const formTitle = document.getElementById('formTitle');
  
  let questions = [];

  // Fetch all questions
  async function loadQuestions() {
    try {
      const res = await fetch('/api/questions');
      questions = await res.json();
      renderList();
    } catch (err) {
      console.error('Error loading questions:', err);
      qList.innerHTML = '<div style="color: red; text-align: center;">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>';
    }
  }

  // Render list
  function renderList() {
    qCount.textContent = questions.length;
    qList.innerHTML = '';
    
    if (questions.length === 0) {
      qList.innerHTML = '<div style="text-align: center; padding: 20px; color: #5d4037;">ยังไม่มีคำถามในระบบ</div>';
      return;
    }

    questions.forEach((q, index) => {
      const el = document.createElement('div');
      el.className = 'q-item';
      
      const correctText = q.choices[q.correctAnswer] || 'ไม่มีเฉลย';
      
      el.innerHTML = `
        <div class="q-title">${index + 1}. ${q.question}</div>
        <div class="q-desc">
          <strong>เฉลย:</strong> ${correctText} <br>
          <small style="color: #666;">${q.explanation ? 'อธิบาย: ' + q.explanation : ''}</small>
        </div>
        <div class="q-actions">
          <button class="btn-edit" onclick="editQuestion(${index})">✏️ แก้ไข</button>
          <button class="btn-delete" onclick="deleteQuestion(${index})">🗑️ ลบ</button>
        </div>
      `;
      qList.appendChild(el);
    });
  }

  // Form Submit (Add/Edit)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('editId').value;
    const qData = {
      question: document.getElementById('qText').value,
      choices: [
        document.getElementById('qC0').value,
        document.getElementById('qC1').value,
        document.getElementById('qC2').value,
        document.getElementById('qC3').value
      ],
      correctAnswer: parseInt(document.querySelector('input[name="qCorrect"]:checked').value),
      explanation: document.getElementById('qExp').value
    };

    try {
      if (id === '') {
        // Add
        await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(qData)
        });
        alert('เพิ่มคำถามสำเร็จ!');
      } else {
        // Edit
        await fetch(`/api/questions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(qData)
        });
        alert('แก้ไขคำถามสำเร็จ!');
      }
      
      clearForm();
      loadQuestions();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  });

  // Edit action
  window.editQuestion = (index) => {
    const q = questions[index];
    document.getElementById('editId').value = index;
    document.getElementById('qText').value = q.question;
    document.getElementById('qC0').value = q.choices[0] || '';
    document.getElementById('qC1').value = q.choices[1] || '';
    document.getElementById('qC2').value = q.choices[2] || '';
    document.getElementById('qC3').value = q.choices[3] || '';
    document.querySelector(`input[name="qCorrect"][value="${q.correctAnswer}"]`).checked = true;
    document.getElementById('qExp').value = q.explanation || '';
    
    formTitle.textContent = '✏️ แก้ไขคำถาม';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete action
  window.deleteQuestion = async (index) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบคำถามข้อนี้?')) return;
    
    try {
      await fetch(`/api/questions/${index}`, { method: 'DELETE' });
      loadQuestions();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  // Clear Form
  function clearForm() {
    form.reset();
    document.getElementById('editId').value = '';
    formTitle.textContent = '➕ เพิ่มคำถามใหม่';
    document.querySelector('input[name="qCorrect"][value="0"]').checked = true;
  }

  btnCancel.addEventListener('click', clearForm);

  // Initial load
  loadQuestions();
});
