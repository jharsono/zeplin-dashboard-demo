import { useEffect, useState } from "react";
import './App.css';
import { ZeplinApi, Configuration } from '@zeplin/sdk';
import Table from 'react-bootstrap/Table';
import { countBy } from 'lodash';
import 'chart.js/auto';
import { Chart } from 'react-chartjs-2';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';

const { REACT_APP_PERSONAL_ACCESS_TOKEN, REACT_APP_WORKSPACE_ID } = process.env;

const zeplin = new ZeplinApi(
  new Configuration({ accessToken: REACT_APP_PERSONAL_ACCESS_TOKEN })
);

const App = () => {
  const [projects, setProjects] = useState([]);
  const [styleguides, setStyleguides] = useState([]);
  const [projectTypes, setProjectTypes] = useState({});

  const getAllProjects = async () => {
    const projects = [];
    let data;
    let i = 0;
    do {
      // eslint-disable-next-line no-await-in-loop
      ({ data } = await zeplin.organizations.getOrganizationProjects(REACT_APP_WORKSPACE_ID, {
        offset: i * 100,
        limit: 100,
      }));
      projects.push(...data);
      i += 1;
    } while (data.length === 100);
    
    const activeProjects = projects.filter((project) => project.status === 'active');
    setProjects(activeProjects);

    setProjectTypes(countBy(projects.map(project => project.platform)));
  };

  const getAllStyleguides = async () => {
    const styleguides = [];
    let data;
    let i = 0;
    do {
      // eslint-disable-next-line no-await-in-loop
      ({ data } = await zeplin.organizations.getOrganizationStyleguides(REACT_APP_WORKSPACE_ID, {
        offset: i * 100,
        limit: 100,
      }));
      styleguides.push(...data);
      i += 1;
    } while (data.length === 100);
    
    setStyleguides(styleguides.filter((project) => project.status === 'active'));
  };

  const getStyleguideNameFromId = ({id}) => {
    // find if styleguide exists in workspace
    const styleguide = styleguides.find(sg => sg.id === id);

    if (!styleguide) {
      return
    }
    return styleguide.name;
  }

  useEffect(() => {
    getAllProjects();
    getAllStyleguides();
  }, [])
 
  const ProjectTable = () => {
    const projectRows = projects.map(project => {
      return (
        <tr key={project.id}>
          <td>{project.name}</td>
          <td>{project.platform}</td>
          
          {project.workflowStatus ? (
            <td>{project.workflowStatus.name}</td>
          ) : (
            <td>-</td>
          )}

          <td>{project.numberOfMembers}</td>
          <td>{project.numberOfScreens}</td>
          
          {project.linkedStyleguide ? (
            <td><a href={`http://app.zeplin.io/styleguide/${project.linkedStyleguide.id}`} target="blank">{getStyleguideNameFromId(project.linkedStyleguide)}</a> </td>
          ) : (
            <td>-</td>
          )
          }
        </tr>
      )
    })

    return (
      <Table striped bordered>
      <thead>
        <tr>
          <th>Name</th>
          <th>Platform</th>
          <th>Workflow Status</th>
          <th>Number of Members</th>
          <th>Number of Screens</th>
          <th>Linked Styleguide</th>
        </tr>
      </thead>

      <tbody>
        {projectRows}
      </tbody>
    </Table>
    )
  }

  const ProjectsWithLinkedStyleguidesPieChart = () => {
    const projectsWithLinkedStyleguides = projects.filter(project => project.linkedStyleguide);
    const projectsWithoutLinkedStyleguides = projects.filter(project => !project.linkedStyleguide);

    const data = {
      labels: ['Has Linked Styleguide', 'No Linked Styleguide'],
      datasets: [{
        label: 'Projects with Linked Styleguides',
        data: [projectsWithLinkedStyleguides.length, projectsWithoutLinkedStyleguides.length],
        backgroundColor: [
          'rgb(253, 189, 57)',
          'rgb(200, 207, 45)',
        ],
        hoverOffset: 4
      }]
    }

    return (
      <div className="w-50 h-auto">
      <Chart 
            type="pie"
            datasetIdKey='linkedStyleguides'
            data={data}
          />
      </div>
    )
  }

  const ProjectTypePieChart = () => {
    const data = {
      labels: Object.keys(projectTypes),
      datasets: [{
        label: 'Project Types',
        data: Object.values(projectTypes),
        backgroundColor: [
          'rgb(253, 189, 57)',
          'rgb(200, 207, 45)',
          'rgb(13, 207, 218)',
          'rgb(65, 155, 249)'
        ],
        hoverOffset: 4
      }]
    };  
    
    return (
      <div className="w-50 h-auto">
      <Chart 
            type="pie"
            datasetIdKey='projectTypes'
            data={data}
          />
      </div>
    
    )
  }

  return (
    <div className="App">
      <Container>
        <Row>
          <ProjectTypePieChart />
          <ProjectsWithLinkedStyleguidesPieChart />
        </Row>
      </Container>

      <ProjectTable />
    </div>
  );
}

export default App;
