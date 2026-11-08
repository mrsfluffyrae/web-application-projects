function gradeOf(score) { return score >= 70 ? ['A', 4] : score >= 60 ? ['B', 3] : score >= 50 ? ['C', 2] : score >= 40 ? ['D', 1] : ['E', 0]; }
function computeGpa(units) {
  const graded = units.filter(u => u.score !== null && u.score !== '' && !isNaN(u.score));
  const credits = graded.reduce((s, u) => s + u.credits, 0);
  if (!credits) return 0;
  return graded.reduce((s, u) => s + gradeOf(+u.score)[1] * u.credits, 0) / credits;
}
function cumulativeGpa(data, units) {
  const cur = units.filter(u => u.score !== null && u.score !== '').reduce((s, u) => s + u.credits, 0);
  const pts = data.semesters.reduce((s, x) => s + x.gpa * x.credits, 0) + computeGpa(units) * cur;
  const cr = data.semesters.reduce((s, x) => s + x.credits, 0) + cur;
  return pts / cr;
}
function renderGrades(data) {
  const units = getEnrolled(data);
  const body = document.getElementById('grade-rows');
  body.innerHTML = '';
  units.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><code>${u.code}</code></td><td>${u.title}</td><td>${u.credits}</td>
      <td><input type="number" min="0" max="100" value="${u.score ?? ''}" aria-label="Score for ${u.code}"></td><td class="g"></td>`;
    const input = tr.querySelector('input');
    const refresh = () => {
      u.score = input.value === '' ? null : Math.min(100, Math.max(0, +input.value));
      tr.querySelector('.g').textContent = u.score === null ? '-' : gradeOf(u.score)[0];
      Store.set('enrolled', units);
      document.getElementById('sem-gpa').textContent = computeGpa(units).toFixed(2);
      document.getElementById('cum-gpa').textContent = cumulativeGpa(data, units).toFixed(2);
    };
    input.addEventListener('input', refresh);
    body.appendChild(tr); refresh();
  });
}
