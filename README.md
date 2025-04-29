# Future Drought Explorer System

This is the group project for COMP9900, developed by Team 9900-H18A-AVOCADO. The system provides an interactive interface for exploring projected drought changes under different climate scenarios.

---

## 👥 Team Information

| Name           | Zid       | Email                         | Role           | Area      |
|----------------|-----------|-------------------------------|----------------|-----------|
| Yangyang Chen  | z5473726  | z5473726@ad.unsw.edu.au       | Group Member   | Front-end |
| Haoze Jin      | z5430906  | z5430906@ad.unsw.edu.au       | Group Member   | Back-end  |
| Jiawei Ma      | z5454881  | z5454881@ad.unsw.edu.au       | Product Owner  | Front-end |
| Boxiang Xu     | z5457633  | z5457633@ad.unsw.edu.au       | Scrum Master   | Front-end |
| Hexiang Wan    | z5509425  | z5509425@ad.unsw.edu.au       | Group Member   | Front-end |
| Teng Zang      | z5486949  | z5486949@ad.unsw.edu.au       | Group Member   | Back-end  |

---

## 🚀 Quick Start (Docker)

Make sure Docker and Docker Compose are installed on your machine.

### Steps:

1. **Get the code**  
   Clone the repository or download and unzip the source code.

2. **Start Docker Desktop**  
   Open Docker and navigate to the project root directory in terminal.

3. **Run the container**
   docker-compose up --build
   This will build the images (if needed) and launch both frontend and backend containers.
4. **Access the application**
   Frontend: http://localhost:3000
   Backend: http://localhost:9901

---

## 🧪 Testing & Evidence

1. **All test files are located in:**
   frontend/src/tests/

2. **The tests are written using Jest and React Testing Library.**

3. **To run all tests:**
   npm test -- --watchAll=false

4. **open the visual coverage report in:**
   frontend/coverage/lcov-report/index.html