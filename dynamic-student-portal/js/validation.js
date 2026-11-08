const Rules = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  name: /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/,
  phone: /^\+?[0-9 ]{9,15}$/
};
function setError(input, msg) {
  const slot = document.getElementById(input.id + '-error');
  if (slot) slot.textContent = msg;
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  return !msg;
}
function validateLogin(form) {
  const email = form.elements.email, pass = form.elements.password;
  let ok = true;
  ok = setError(email, !email.value.trim() ? 'Enter your email.' : !Rules.email.test(email.value) ? 'Enter a valid email address.' : '') && ok;
  ok = setError(pass, !pass.value ? 'Enter your password.' : pass.value.length < 6 ? 'Password must be at least 6 characters.' : '') && ok;
  return ok;
}
function validateProfile(form) {
  const n = form.elements.name, p = form.elements.phone;
  let ok = true;
  ok = setError(n, !n.value.trim() ? 'Enter your full name.' : !Rules.name.test(n.value.trim()) ? 'Use letters and spaces only.' : '') && ok;
  ok = setError(p, !Rules.phone.test(p.value.trim()) ? 'Enter a valid phone number.' : '') && ok;
  return ok;
}
function validateCourse(select, enrolled, data) {
  const unit = data.available.find(u => u.code === select.value);
  if (!unit) return setError(select, 'Select a course to register.') && null;
  const total = enrolled.reduce((s, u) => s + u.credits, 0) + unit.credits;
  if (total > data.maxCredits) { setError(select, `This would bring you to ${total} credits. The limit is ${data.maxCredits}.`); return null; }
  const clash = enrolled.find(u => u.day === unit.day && u.start < unit.end && unit.start < u.end);
  if (clash) { setError(select, `Clashes with ${clash.code} on ${clash.day}.`); return null; }
  setError(select, '');
  return unit;
}
