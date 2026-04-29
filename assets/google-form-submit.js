const SPEED_AI_GOOGLE_FORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSd8PwprDZC7K6oYLyyyO6H1eYC7__c6ivH0XNJMEPLxXA5hvQ/formResponse";
const SPEED_AI_GOOGLE_FORM_EMAIL_FIELD = "emailAddress";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function submitGoogleFormEmail(email) {
  const formData = new FormData();
  formData.append(SPEED_AI_GOOGLE_FORM_EMAIL_FIELD, email);
  formData.append("fvv", "1");
  formData.append("pageHistory", "0");

  await fetch(SPEED_AI_GOOGLE_FORM_ACTION, {
    method: "POST",
    mode: "no-cors",
    body: formData,
  });
}

async function submitDownloadForm(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const input = form.querySelector('input[type="email"]');
  const button = form.querySelector('button[type="submit"]');
  const email = input.value.trim();

  if (!email) {
    alert("Please enter your email");
    input.focus();
    return;
  }

  if (!isValidEmail(email)) {
    alert("Please enter a valid email");
    input.focus();
    return;
  }

  const originalText = button ? button.innerHTML : "";

  try {
    if (button) {
      button.disabled = true;
      button.textContent = "Submitting...";
    }

    await submitGoogleFormEmail(email);
    localStorage.setItem("user_email", email);
    alert(form.dataset.successMessage || "Thanks. We will send the Speed PDF Windows download to your email.");
    form.reset();
  } catch (error) {
    alert("Sorry, something went wrong. Please try again.");
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = originalText;
    }
  }
}
