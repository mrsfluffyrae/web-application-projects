const page = document.body.dataset.page;
document.documentElement.dataset.theme = Store.get('theme', 'light');
if (page !== 'login' && !Store.get('session', null)) location.replace('login.html');

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('theme-toggle');
  const label = () => toggle.textContent = document.documentElement.dataset.theme === 'dark' ? 'Light mode' : 'Dark mode';
  label();
  toggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next; Store.set('theme', next); label();
  });
  const out = document.getElementById('sign-out');
  if (out) out.addEventListener('click', () => { localStorage.removeItem('session'); location.href = 'login.html'; });
  if (page === 'login') return initLogin();
  loadPortal().then(data => ({ index: initDashboard, profile: initProfile, courses: initCourses, grades: renderGrades }[page] || (() => {}))(data)).catch(() => {});
});

function initLogin() {
  const form = document.getElementById('login-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateLogin(form)) return;
    if (form.elements.email.value.trim().toLowerCase() === 'amina.wanjiru@student.edu' && form.elements.password.value === 'portal123') {
      Store.set('session', { email: form.elements.email.value }); location.href = 'index.html';
    } else document.getElementById('login-error').textContent = 'Email or password is incorrect.';
  });
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function initDashboard(data) {
  const units = getEnrolled(data);
  let d = DAYS[new Date().getDay()], note = 'Today';
  if (d === 'Sat' || d === 'Sun') { d = 'Mon'; note = 'Next: Monday'; }
  document.getElementById('greeting').textContent = `${data.student.name} - ${data.student.program}, Year ${data.student.year}`;
  document.getElementById('today-label').textContent = note;
  const list = document.getElementById('schedule');
  const today = units.filter(u => u.day === d).sort((a, b) => a.start.localeCompare(b.start));
  list.innerHTML = today.length ? today.map(u => `<li><time>${u.start} - ${u.end}</time><div><strong>${u.title}</strong><span class="muted"><code>${u.code}</code> in ${u.hall}</span></div></li>`).join('') : '<li>No classes scheduled.</li>';
  const gpa = cumulativeGpa(data, units);
  document.getElementById('gpa').textContent = gpa.toFixed(2);
  document.getElementById('gpa-bar').style.width = (gpa / 4 * 100) + '%';
  document.getElementById('gpa-note').textContent = 'out of 4.00';
  const cr = units.reduce((s, u) => s + u.credits, 0);
  document.getElementById('stats').innerHTML = `<div><dt>Units</dt><dd>${units.length}</dd></div><div><dt>Credits</dt><dd>${cr} / ${data.maxCredits}</dd></div><div><dt>Semester GPA</dt><dd>${computeGpa(units).toFixed(2)}</dd></div>`;
  const pts = [...data.semesters, { label: 'Y3 S2', gpa: computeGpa(units) }];
  document.getElementById('chart').innerHTML = pts.map(s => `<div><span>${s.gpa.toFixed(1)}</span><i style="height:${s.gpa / 4 * 100}%"></i><span class="muted">${s.label}</span></div>`).join('');
  const students = data.classmates.map(c => new Student(c.name, '', c.course, c.year));
  const ul = document.getElementById('student-list'), btn = document.getElementById('show-students');
  btn.addEventListener('click', () => {
    ul.innerHTML = '';
    students.forEach(s => { const li = document.createElement('li'); li.textContent = s.getSummary(); ul.appendChild(li); });
    document.getElementById('student-count').textContent = `${students.length} students registered`;
  });
}

function initProfile(data) {
  const s = Store.get('profile', data.student);
  const fill = () => {
    document.getElementById('p-name').textContent = s.name;
    document.getElementById('p-sub').textContent = `${s.program}, Year ${s.year}`;
    document.getElementById('avatar').textContent = s.name.split(' ').map(w => w[0]).join('').slice(0, 2);
    document.getElementById('p-details').innerHTML = `<div><dt>Registration number</dt><dd><code>${s.reg}</code></dd></div><div><dt>Email</dt><dd></dd></div><div><dt>Phone</dt><dd></dd></div>`;
    const dd = document.querySelectorAll('#p-details dd'); dd[1].textContent = s.email; dd[2].textContent = s.phone;
    document.getElementById('p-bio').textContent = s.bio;
  };
  fill();
  const form = document.getElementById('profile-form');
  form.elements.name.value = s.name; form.elements.phone.value = s.phone; form.elements.bio.value = s.bio;
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateProfile(form)) return;
    Object.assign(s, { name: form.elements.name.value.trim(), phone: form.elements.phone.value.trim(), bio: form.elements.bio.value.trim() });
    Store.set('profile', s); fill();
    document.getElementById('saved').textContent = 'Changes saved.';
  });
}

function initCourses(data) {
  const units = getEnrolled(data);
  const rows = document.getElementById('enrolled-rows'), select = document.getElementById('course');
  const draw = () => {
    rows.innerHTML = '';
    units.forEach((u, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><code>${u.code}</code></td><td>${u.title}</td><td>${u.day} ${u.start} - ${u.end}</td><td>${u.hall}</td><td>${u.credits}</td><td><button class="btn" type="button">Drop</button></td>`;
      tr.querySelector('button').addEventListener('click', () => { units.splice(i, 1); Store.set('enrolled', units); draw(); });
      rows.appendChild(tr);
    });
    document.getElementById('total').textContent = `${units.reduce((s, u) => s + u.credits, 0)} of ${data.maxCredits} credits`;
    select.innerHTML = '<option value="">Select a course</option>' + data.available.filter(a => !units.some(u => u.code === a.code))
      .map(a => `<option value="${a.code}">${a.code} - ${a.title} (${a.credits} credits)</option>`).join('');
  };
  draw();
  document.getElementById('course-form').addEventListener('submit', e => {
    e.preventDefault();
    const unit = validateCourse(select, units, data);
    if (unit) { units.push({ ...unit }); Store.set('enrolled', units); draw(); }
  });
}
