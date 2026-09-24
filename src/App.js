import React, { useState, useEffect } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";

function App() {

  const [hospitals, setHospitals] = useState([]);

  const [formData, setFormData] = useState({
    name:"",
    location:"",
    injuryLevel:"",
    description:""
  });

  const [reports, setReports] = useState([]);

  const [stats, setStats] = useState({
  total: 0,
  pending: 0,
  dispatched: 0,
  resolved: 0
  });

  const handleChange = (e)=>{
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e)=>{
    e.preventDefault();

    try {

      await axios.post("http://localhost:5000/report", formData);

      alert("Accident Report Submitted");

    } catch (error) {

      alert("Error submitting report");

    }

    setFormData({
      name:"",
      location:"",
      injuryLevel:"",
      description:""
    });

    fetchReports();
  };
  
  const fetchReports = async ()=>{
  const res = await axios.get("http://localhost:5000/reports");
  setReports(res.data);
};

  const fetchStats = async () => {

  const res = await axios.get("http://localhost:5000/stats");

  setStats(res.data);

};

  useEffect(()=>{
    fetchReports();
    fetchStats();
  },[]);

  const getLocation = () => {

  if (navigator.geolocation) {

    navigator.geolocation.getCurrentPosition(

      async (position) => {

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        // Reverse geocoding to get place name
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );

        const data = await response.json();

setFormData({
  ...formData,
  location: data.display_name
});

        // Get nearby hospitals
        const hospitalRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=hospital&limit=5&viewbox=${longitude-0.05},${latitude+0.05},${longitude+0.05},${latitude-0.05}&bounded=1`
        );

        const hospitalData = await hospitalRes.json();
        setHospitals(hospitalData);

      },

      (error) => {
        console.log(error);
        alert("Unable to get location");
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }

    );

  } else {

    alert("Geolocation not supported");

  }

};

  return (
    <div className="container mt-4">

      <h1 className="text-center mb-4">🚑 CrashReport</h1>
<p className="text-center text-muted">
Citizen Accident Reporting Platform
</p>

      <div className="card p-4 shadow mb-4">

<h4 className="mb-3">Report an Accident</h4>

<form onSubmit={handleSubmit}>

<input
className="form-control mb-3"
name="name"
placeholder="Your Name"
value={formData.name}
onChange={handleChange}
/>

<input
className="form-control mb-3"
name="location"
placeholder="Accident Location"
value={formData.location}
onChange={handleChange}
/>

<button
type="button"
className="btn btn-secondary mb-3"
onClick={getLocation}
>
📍 Get My Location
</button>

<select
className="form-select mb-3"
name="injuryLevel"
value={formData.injuryLevel}
onChange={handleChange}
>
<option value="">Select Injury Level</option>
<option value="Minor">Minor</option>
<option value="Moderate">Moderate</option>
<option value="Severe">Severe</option>
</select>

<textarea
className="form-control mb-3"
name="description"
placeholder="Describe the accident"
value={formData.description}
onChange={handleChange}
/>

<button
type="submit"
className="btn btn-danger w-100"
>
🚨 Report Accident
</button>

</form>

</div>
      <div className="row text-center mb-4">

<div className="col">
<div className="card p-3 bg-dark text-white">
<h5>Total Accidents</h5>
<h2>{stats.total}</h2>
</div>
</div>

<div className="col">
<div className="card p-3 bg-warning">
<h5>Pending</h5>
<h2>{stats.pending}</h2>
</div>
</div>

<div className="col">
<div className="card p-3 bg-danger text-white">
<h5>Ambulance Dispatched</h5>
<h2>{stats.dispatched}</h2>
</div>
</div>

<div className="col">
<div className="card p-3 bg-success text-white">
<h5>Resolved</h5>
<h2>{stats.resolved}</h2>
</div>
</div>

</div>
      <h2>Nearby Hospitals</h2>

      {hospitals.map((hospital, index)=>(
  <div key={index} className="card p-3 mb-3">

    <h5>{hospital.display_name.split(",")[0]}</h5>

    <button
      className="btn btn-danger me-2"
      onClick={() => {

        if(window.confirm("Call Ambulance (108)?")){
          window.location.href="tel:108";
        }

      }}
    >
      🚑 Call Ambulance
    </button>

    <button
      className="btn btn-warning"
      onClick={async () => {

  if(!formData.name || !formData.injuryLevel || !formData.location){

    alert("Please fill the accident form before requesting an emergency appointment.");
    return;

  }

  try{

    await axios.post("http://localhost:5000/appointment",{

      hospitalName: hospital.display_name,
      patientName: formData.name,
      injuryLevel: formData.injuryLevel,
      location: formData.location

    });

    alert("Emergency appointment requested successfully");

  }catch(error){

    console.log(error);
    alert("Error requesting appointment");

  }

}}
    >
      🏥 Emergency Appointment
    </button>

  </div>
))}
      <h2>Recent Accident Reports</h2>

      {reports.map((report)=>(
        <div key={report._id} style={{border:"1px solid gray", margin:"10px", padding:"10px"}}>

          <p><b>Name:</b> {report.name}</p>
          <p><b>Location:</b> {report.location}</p>

          <p>
          <b>Injury Level:</b>
          <span style={{
            color:
              report.injuryLevel === "Minor"
                ? "green"
                : report.injuryLevel === "Moderate"
                ? "orange"
                : "red"
          }}>
            {report.injuryLevel}
          </span>
          </p>

          <p><b>Description:</b> {report.description}</p>
          <p><b>Status:</b> {report.status}</p>

          <select
            onChange={async (e)=>{

              await axios.put(
                `http://localhost:5000/update-status/${report._id}`,
                { status: e.target.value }
              );

              fetchReports();

            }}
          >

          <option value="">Update Status</option>
          <option value="Pending">Pending</option>
          <option value="Ambulance Dispatched">Ambulance Dispatched</option>
          <option value="Resolved">Resolved</option>

          </select>

        </div>
      ))}

    </div>
  );
}

export default App;
