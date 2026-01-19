# AI Dev Tools Zoomcamp Repo

This is my repo for my projects for the *free* AI Dev Tools Zoomcamp course, hosted by DataTalks.Club and taught by Alexey Grigorev. The course launched on November 18, 2025.  More information can be found at https://github.com/DataTalksClub/ai-dev-tools-zoomcamp.

## Module 1 — Introduction to Vibe Coding / AI Tools Overview
### Introduction to Vibe Coding (Workshop)
The first module of the course provides an introduction to AI coding tools through the creation of simple project demos.  During the Introduction to Vibe Coding Workshop, we learned how to use AI coding tools to create the classic "snake" game.  

I created this game in three different tools:  ChatGPT, Claude Code (CLI version), and Lovable.  Claude Code won the bake-off against ChatGPT: it was 100% functional right out of the box, and looked better, too.  Lovable was the easiest to implement, however, and had the nicest appearance of the three.

My repo for the workshop: https://github.com/gdurante2019/AI-Dev-Tools-Intro-Vibe-Coding.  
The DataTalksClub workshop repo: https://github.com/DataTalksClub/ai-dev-tools-zoomcamp/tree/main/01-overview. 

### Homework assignment:  Create a to-do app using Django and the AI coding tool of your choice
I used Claude Code's CLI to create the app, following the homework instructions at https://github.com/DataTalksClub/ai-dev-tools-zoomcamp/blob/main/cohorts/2025/01-overview/homework.md.  The code for my project can be found in the TODO directory of this repo.

## Module 2 — End-to-End Application (Snake Game)
For this module, we are learning how to create an end-to-end application using AI tools--creating the frontend, extracting OpenAI specs from the frontend, implementing the backend using FastAPI, adding database support to the backend, containerizing the works, deploying to Render, and creating a CI/CD pipeline for deployment.  

Link to my Snake Game implementation on Lovable: URL: https://curious-critter-cosmos.lovable.app

**Frontend:** I used Lovable to create the frontend.  You can create repos for your Lovable projects in GitHub.  My repo for this project is at https://github.com/gdurante2019/snake-social/tree/main. 

**Using Google's Antigravity with GitHub Codespaces (Optional exercise):**
Antigravity had just come out in December and was a free AI-assisted coding tool, so Alexey showed how to use Antigravity with Codespaces.  It requires a special setup (as does Cursor, apparently) to connect with Codespaces.  Even though VS Code is integrated with Codespaces (so it's simple to connect in VS Code), I love a challenge and decided to take on this optional exercise.  I was successful in getting it set up using GitHub CLI and connecting via SSH!

**Frontend tests:**  As suggested by Alexey in the video for this section, I asked Antigravity's coding agent (Gemini 3 pro) to help me run frontend tests.  Antigravity ran the tests (all passed) and provided a "walkthrough" file documenting how to perform these tests.  This file, called "TESTING.md", is included in the frontend directory.

**Integrating frontend and backend:** 
* The actual integration of frontend and backend required some back-and-forth with the coding partner, but we (it) were successful in getting it to work.
* More time-consuming were the edits necessary to both the login functions (which repeatedly threw errors) and the corrections to Spectate mode, game play modes ("Walls" vs. "Infinite"), and Leaderboard display modes.
  * I considered switching to Claude, since it seems better at coding than Gemini at present; however, I decided to stick with Gemini throughout this exercise for consistency's sake.
  * While I am not a full-stack engineer (well, especially _because_ I'm not a full-stack engineer), I reviewed both the fixes proposed by the coding partner and the "thinking" output as well, to understand the steps the agent took to investigated problems and propose fixes.  
  * One interesting thing I noticed in the agent's "thinking" is when the code changes it made to fix one problem caused other problems.  It said to itself, "I've made a horrible mistake."  I wanted to tell it not to be so hard on itself :-D.  In the end, the coding agent was able to repair the code and successfully implement other fixes.  

**Remaining steps in progress...**
