class Student {
  constructor(name, email, course, year) { this.name = name; this.email = email; this.course = course; this.year = year; }
  getSummary() { return `${this.name} - ${this.course}, Year ${this.year}`; }
}
const Store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};
async function loadPortal() {
  try {
    const res = await fetch('data/portal.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    const main = document.querySelector('main');
    if (main) main.insertAdjacentHTML('afterbegin',
      '<p class="banner error" role="alert">Could not load portal data. Open the site through a local server (python3 -m http.server), not by double-clicking the file.</p>');
    throw err;
  }
}
const getEnrolled = (data) => Store.get('enrolled', data.units);
