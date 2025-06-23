// Updated script.js
document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("file-upload");
  const fileNameElement = document.getElementById("file-name");
  const fileNameText = fileNameElement.querySelector("span");
  const uploadForm = document.getElementById("upload-form");
  const errorMessage = document.getElementById("error-message");
  const loadingSpinner = document.getElementById("loading-spinner");
  const uploadArea = document.getElementById("upload-area");
  const analyzeButton = document.getElementById("analyze-button");
  const detailsButton = document.getElementById("details-button");
  const reportButton = document.getElementById("report-button");

  // Dialog elements
  const detailsDialog = document.getElementById("details-dialog");
  const reportDialog = document.getElementById("report-dialog");
  const detailsClose = document.getElementById("details-close");
  const reportClose = document.getElementById("report-close");

  // File upload handler
  fileInput?.addEventListener("change", function () {
    const file = this.files[0];

    if (file) {
      // Update file name display
      const fileName = file.name;
      fileNameText.textContent = fileName;
      fileNameElement.classList.add("file-selected");

      // Enable analyze button
      analyzeButton.disabled = false;
    } else {
      fileNameText.textContent = "No file selected";
      fileNameElement.classList.remove("file-selected");
      analyzeButton.disabled = true;
    }

    // Reset error message if it was shown
    errorMessage.classList.remove("show");
  });

  // Make the entire upload area clickable
  if (uploadArea) {
    uploadArea.addEventListener("click", function (e) {
      // Prevent triggering click when clicking on the analyze button
      if (e.target !== analyzeButton && !analyzeButton.contains(e.target)) {
        fileInput.click();
      }
    });

    // Drag and drop functionality
    ["dragenter", "dragover"].forEach((eventName) => {
      uploadArea.addEventListener(
        eventName,
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          uploadArea.classList.add("drag-over");
        },
        false,
      );
    });

    ["dragleave", "drop"].forEach((eventName) => {
      uploadArea.addEventListener(
        eventName,
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          uploadArea.classList.remove("drag-over");
        },
        false,
      );
    });

    uploadArea.addEventListener(
      "drop",
      function (e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length) {
          fileInput.files = files;
          // Trigger change event manually
          const event = new Event("change");
          fileInput.dispatchEvent(event);
        }
      },
      false,
    );
  }

  // Form submission
  uploadForm?.addEventListener("submit", function (event) {
    if (!fileInput.files.length) {
      event.preventDefault();
      errorMessage.textContent = "Please select an image file.";
      errorMessage.classList.add("show");
    } else {
      errorMessage.classList.remove("show");
      loadingSpinner.style.display = "block";
      analyzeButton.disabled = true;
      analyzeButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }
  });

  // Open details dialog
  detailsButton?.addEventListener("click", function () {
    openDialog(detailsDialog);
  });

  // Open report dialog
  reportButton?.addEventListener("click", function () {
    openDialog(reportDialog);
  });

  // Close buttons for dialogs
  detailsClose?.addEventListener("click", function () {
    closeDialog(detailsDialog);
  });

  reportClose?.addEventListener("click", function () {
    closeDialog(reportDialog);
  });

  // Close dialogs when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target === detailsDialog) {
      closeDialog(detailsDialog);
    }
    if (event.target === reportDialog) {
      closeDialog(reportDialog);
    }
  });

  // Close dialogs with Escape key
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (detailsDialog?.style.display === "flex") {
        closeDialog(detailsDialog);
      }
      if (reportDialog?.style.display === "flex") {
        closeDialog(reportDialog);
      }
    }
  });
});

// Dialog helper functions
function openDialog(dialog) {
  if (!dialog) return;
  dialog.style.display = "flex";
  document.body.style.overflow = "hidden"; // Prevent scrolling of body
}

function closeDialog(dialog) {
  if (!dialog) return;
  dialog.style.display = "none";
  document.body.style.overflow = ""; // Restore scrolling
}

// Submit report function
function submitReport() {
  const reportText = document.getElementById("report-text").value;
  const errorMessage = document.getElementById("error-message");

  if (!reportText.trim()) {
    errorMessage.textContent = "Please enter information to report.";
    errorMessage.classList.add("show");
    return;
  }

  errorMessage.classList.remove("show");
  const reportButton = document.querySelector(".report-form .btn");
  const originalText = reportButton.innerHTML;
  reportButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  reportButton.disabled = true;

  fetch("/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ report: reportText }),
  })
    .then((response) => {
      if (response.ok) {
        closeDialog(document.getElementById("report-dialog"));
        showSuccess("Thank you for your feedback!");
        document.getElementById("report-text").value = ""; // Clear the textarea
      } else {
        closeDialog(document.getElementById("report-dialog"));
        showSuccess("Thank you for your feedback!");
        document.getElementById("report-text").value = ""; // Clear the textarea
      }
    })
    .finally(() => {
      reportButton.innerHTML = originalText;
      reportButton.disabled = false;
    });
}

// Show error message
function showError(message) {
  const errorMessage = document.getElementById("error-message");
  errorMessage.textContent = message;
  errorMessage.classList.add("show");
}

// Show success message
function showSuccess(message) {
  const successMessage = document.getElementById("success-message");
  successMessage.textContent = message;
  successMessage.classList.add("show");

  setTimeout(() => {
    successMessage.classList.remove("show");
  }, 3000);
}
