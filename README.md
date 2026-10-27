
# PRISM
### Photographic Reconstruction for Indoor Spatial Modeling

**Transform ordinary indoor photographs into interactive 3D spaces in your browser.**

PRISM is a seventh-semester final-year project developed at **KIIT Deemed to be University**. It aims to simplify indoor photogrammetric reconstruction by combining automated image processing, cloud-based infrastructure, and browser-based 3D visualization into a unified workflow.

**Project Supervisor:** Dr. Ajit Kumar Pasayat

---

## 📌 Overview

PRISM is designed to convert approximately **30–50 indoor photographs** captured using a standard smartphone into a navigable 3D spatial environment accessible through a web browser.

The project aims to make photogrammetry more accessible to non-technical users by hiding complex command-line workflows behind a guided interface.

The proposed workflow consists of:

1. Creating a reconstruction project.
2. Uploading multiple indoor photographs.
3. Processing images through an automated reconstruction pipeline.
4. Generating 3D reconstruction artifacts.
5. Exploring the reconstructed environment through an interactive browser-based viewer.

The system combines a Next.js frontend, Supabase cloud infrastructure, COLMAP-based photogrammetry, Gaussian Splatting, and Three.js-based visualization.

---

## 🎯 Project Objectives

- Simplify indoor 3D reconstruction from ordinary photographs.
- Automate image feature extraction, feature matching, and camera pose estimation.
- Provide a guided interface for project creation and image uploads.
- Manage project metadata, reconstruction jobs, and generated assets through cloud infrastructure.
- Enable interactive 3D exploration directly in a web browser.
- Build a modular, maintainable, and cost-conscious reconstruction workflow using open-source technologies.

---

## 🏗️ System Architecture

PRISM is organized into four primary architectural tiers.

| Tier | Technology | Responsibility |
|---|---|---|
| Client Tier | Next.js, React, TypeScript | Project creation, image upload, dashboard, and user interaction |
| Data Tier | Supabase, PostgreSQL, Supabase Storage | Metadata, job tracking, and asset storage |
| Compute Tier | Remote GPU Worker, COLMAP, Gaussian Splatting | Image reconstruction and 3D processing |
| Viewer Tier | Three.js, GaussianSplats3D | Browser-based 3D visualization and exploration |

### End-to-End Workflow

```text
Indoor Photographs (30–50)
           |
           v
    Next.js Frontend
           |
           v
       Supabase
   /               \
PostgreSQL       Object Storage
   |                  |
   +---- Job Queue ---+
           |
           v
   Remote GPU Worker
           |
           v
    COLMAP Pipeline
           |
           v
  Sparse Reconstruction
           |
           v
   Gaussian Splatting
           |
           v
   Generated 3D Assets
           |
           v
 Browser-Based 3D Viewer
 (Three.js / GaussianSplats3D)
```

*The diagram represents the intended end-to-end architecture described in the project presentation.*

---

## ✨ Key Features

### 1. Guided Project Creation
- Create a workspace for an indoor reconstruction project.
- Configure project metadata and indoor categories.
- Initialize a project session.

### 2. Image Upload and Validation
- Guided drag-and-drop image upload.
- Thumbnail previews and image validation.
- Duplicate checks and upload staging.
- Photo coverage guidance based on image count and angles.

### 3. Automated Reconstruction Pipeline
- Image feature extraction.
- Feature matching across multiple photographs.
- Camera pose estimation.
- Sparse point cloud reconstruction.
- Handling of common issues such as insufficient feature matches, low image overlap, and out-of-memory failures.

### 4. Cloud Data Management
- Relational storage for project metadata.
- Reconstruction job lifecycle tracking.
- Storage buckets for uploaded images and generated models.
- Temporary signed URLs for accessing stored assets.

### 5. Interactive 3D Viewer
- Browser-based spatial exploration.
- Camera orbit and navigation controls.
- Point-size and lighting adjustments.
- Visualization powered by Three.js and GaussianSplats3D.

---

## 🧩 Project Modules

PRISM is divided into five specialized engineering modules.

### Module 01 — Point Cloud Feasibility Prototype
**Contributor:** Anurag Panda

- Validates the feasibility of converting multi-view photographs into a sparse point cloud.
- Uses COLMAP to estimate camera positions and triangulate 3D points.
- Verifies generated PLY artifacts using tools such as MeshLab or Blender.
- Establishes the geometric foundation for subsequent Gaussian Splatting.

### Module 02 — Automated Reconstruction Pipeline
**Contributor:** Priyotosh Das

- Automates the COLMAP reconstruction workflow.
- Handles feature extraction and feature matching.
- Estimates camera poses and generates sparse reconstruction outputs.
- Organizes notebook execution, inputs, outputs, and failure handling.

### Module 03 — Frontend Interface and User Experience
**Contributor:** S Larens Behera

- Develops the web-based interface using Next.js, React, and TypeScript.
- Provides guided project creation and drag-and-drop uploads.
- Presents reconstruction progress through a pipeline stepper.
- Enables users to explore reconstructed spaces through an interactive viewer.

### Module 04 — Backend Architecture and Database
**Contributor:** Padmajyoti Priyadarshi

- Designs the Supabase and PostgreSQL data architecture.
- Manages project metadata, uploaded-image records, and reconstruction jobs.
- Configures storage for uploaded photographs and generated 3D assets.
- Supports secure, temporary access to stored models.

### Module 05 — Pipeline Integration and Documentation
**Contributor:** Debiprasad Mishra

- Integrates the specialized project modules into a unified workflow.
- Documents architectural decisions and technology choices.
- Supports verification, quality checks, and end-to-end workflow evaluation.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Database | Supabase, PostgreSQL |
| Object Storage | Supabase Storage |
| Photogrammetry | COLMAP |
| 3D Reconstruction | Gaussian Splatting |
| Model Compression | SPZ |
| 3D Rendering | Three.js, GaussianSplats3D |
| Compute Infrastructure | Remote GPU worker |
| Development and Testing | Notebooks, API testing, manual and integration testing |

---

## 🗄️ Data Architecture

The project separates relational metadata from large reconstruction artifacts.

| Entity / Resource | Storage | Purpose |
|---|---|---|
| `sessions` | PostgreSQL | Session-related records |
| `projects` | PostgreSQL | Project identifiers, ownership/session information, titles, and timestamps |
| `uploaded_images` | PostgreSQL + image storage | Uploaded image metadata and references to image assets |
| `reconstruction_jobs` | PostgreSQL | Tracks reconstruction processing states |
| `reconstructed_models` | PostgreSQL + model storage | Model metadata and references to generated reconstruction artifacts |

### Reconstruction Job Lifecycle

The architecture describes processing stages including:

`queued → extracting → matching → splatting → completed`

Generated assets may include sparse PLY point clouds and optimized Gaussian Splatting files.

---

## 🧪 Testing and Verification

The project presentation describes three levels of verification.

### Unit Testing
- Image validation.
- Data handling.
- Utility functions.

### Integration Testing
- API communication.
- Database connectivity.
- Storage integration.
- Reconstruction worker integration.

### End-to-End Testing
- Project creation.
- Image upload.
- Reconstruction execution.
- Browser-based model viewing.

**Testing methods:** Manual testing, notebook checks, API testing, and reconstruction runs using real image datasets.

---

## ⚠️ Current Limitations

The project presentation identifies the following constraints:

- Reconstruction quality depends on image overlap, lighting, and scene texture.
- Processing requires remote GPU resources and can take several minutes.
- Full end-to-end integration of all stages and broader testing remain future development priorities.

The actual availability of each feature depends on the current implementation and deployment configuration.

---

## 🚀 Future Scope

Potential next steps identified in the project roadmap include:

- Completing end-to-end integration across all reconstruction stages.
- Expanding testing across different indoor environments and datasets.
- Improving reconstruction reliability and failure recovery.
- Further refining the user experience for non-technical users.
- Improving the efficiency and accessibility of remote GPU processing.

---

## 👥 Project Team

| Name | University Roll Number | Responsibility |
|---|---|---|
| Debiprasad Mishra | 23051985 | Pipeline Integration and Documentation |
| Priyotosh Das | 23053065 | COLMAP Automation and Reconstruction Pipeline |
| S Larens Behera | 23053071 | Frontend Interface, Design and User Experience |
| Padmajyoti Priyadarshi | 23053061 | Backend Architecture and Supabase Database |
| Anurag Panda | 23051976 | Point Cloud Feasibility Prototype |

**Institution:** KIIT Deemed to be University  
**School:** School of Computer Engineering  
**Supervisor:** Dr. Ajit Kumar Pasayat  
**Academic Year:** 2026

---

## 🙏 Acknowledgements

We sincerely thank **Dr. Ajit Kumar Pasayat** for his guidance and support throughout this project.

PRISM represents a collaborative effort across frontend development, backend engineering, photogrammetry, pipeline automation, and system integration.

---

## 📄 Project Information

**Project Name:** PRISM  
**Full Form:** Photographic Reconstruction for Indoor Spatial Modeling  
**Project Type:** Seventh-Semester Final Project  
**Institution:** KIIT Deemed to be University

---

*Built collaboratively by the PRISM project team.*
