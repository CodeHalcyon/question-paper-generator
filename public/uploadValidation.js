function uploadValidation(event) {
  console.log("hello");
  const subName = document.getElementById("subName");
  const sem = document.getElementById("sem");
  const year = document.getElementById("year");
  const file = document.getElementById("file");

  if (subName.value === "") {
    alert("Enter the subject name please!");
    subName.focus();
    event.preventDefault();
    return false;
  }

  if (sem.value === "") {
    alert("Select the semester");
    sem.focus();
    event.preventDefault();
    return false;
  }
  if (year.value === "") {
    alert("Select the year");
    year.focus();
    event.preventDefault();
    return false;
  }
  if (file.value === "") {
    alert("Please upload the file");
    file.focus();
    event.preventDefault();
    return false;
  }
}
