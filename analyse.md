# Doctor Portal – Analyse Module

## New Navigation Item: Analyse

Add a new navigation menu item named **"Analyse"** in the Doctor account.

### Feature 1: Patient Documents Analysis

The doctor can view all documents submitted by their own patients.

#### Interface

* Display documents grouped by patient.
* Each patient is shown in a separate card/box containing:

  * Patient name
  * List of uploaded documents
  * Upload date
  * **Analyse** button

#### Workflow

1. Doctor selects a patient's document.
2. Doctor clicks **Analyse**.
3. An AI agent processes the selected document(s).
4. The system generates a preliminary AI medical report containing:

   * Document summary
   * Key findings
   * Potential observations
   * Important alerts or anomalies detected
5. The report is displayed to the doctor and can be downloaded or saved.

### Feature 2: Doctor Document Upload & Analysis

The doctor can upload documents directly for analysis.

#### Interface

* Upload area supporting PDF, images, and medical documents.
* **Analyse** button.

#### Workflow

1. Doctor uploads one or more documents.
2. Doctor clicks **Analyse**.
3. AI agent analyzes the uploaded files.
4. System generates a preliminary AI report.
5. Doctor can:

   * View the report
   * Download the report
   * Save the report to the patient record (optional)

### Permissions

* Doctors can only access documents belonging to their assigned patients.
* Analysis history should be stored for future consultation.

### AI Disclaimer

The generated report is intended as decision-support information only and does not replace professional medical judgment.
