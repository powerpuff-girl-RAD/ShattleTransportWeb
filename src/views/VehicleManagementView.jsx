import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import BusAlertOutlinedIcon from "@mui/icons-material/BusAlertOutlined";
import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DirectionsBusOutlinedIcon from "@mui/icons-material/DirectionsBusOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { createVehicle, fetchVehicles, updateVehicle } from "../controllers/vehicleController";
import "./ServiceManagement.css";
import "./VehicleManagement.css";

const emptyDraft = {
  name: "",
  category: "Bus",
  id: "",
  depot: "",
  type: "1",
  status: "Active",
};
const statusTone = {
  Active: "mint",
  Delayed: "orange",
  "Short turn": "red",
  Upcoming: "blue",
  "In Maintenance": "amber",
};
const PAGE_SIZE = 7;

function VehicleManagementView() {
  const dispatch = useDispatch();
  const { vehicles, loadStatus, loadError, createStatus, updateStatus } = useSelector((state) => state.vehicles);
  const [hiddenVehicleIds, setHiddenVehicleIds] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState("");
  const now = new Date();
  const currentDate = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
  const servicePeriod = now.getHours() >= 5 && now.getHours() < 12 ? "Morning" : now.getHours() < 17 ? "Afternoon" : now.getHours() < 21 ? "Evening" : "Night";
  const busCount = vehicles.filter((vehicle) => vehicle.type === "Bus").length;
  const trainCount = vehicles.filter((vehicle) => vehicle.type === "Train").length;
  const activeCount = vehicles.filter((vehicle) => vehicle.status === "Active").length;
  const delayedCount = vehicles.filter((vehicle) => vehicle.status === "Delayed").length;
  const upcomingCount = vehicles.filter((vehicle) => vehicle.status === "Upcoming").length;
  const inMaintenanceCount = vehicles.filter((vehicle) => vehicle.status === "In Maintenance").length;
  const inMaintenanceBusCount = vehicles.filter((vehicle) => vehicle.status === "In Maintenance" && vehicle.type === "Bus").length;
  const inMaintenanceTrainCount = vehicles.filter((vehicle) => vehicle.status === "In Maintenance" && vehicle.type === "Train").length;
  const filteredVehicles = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          !hiddenVehicleIds.includes(vehicle.id) &&
          `${vehicle.name} ${vehicle.id} ${vehicle.depot} ${vehicle.type} ${vehicle.status}`.toLowerCase().includes(search.toLowerCase()) &&
          (status === "All" || vehicle.status === status),
      ),
    [hiddenVehicleIds, search, status, vehicles],
  );
  const pageCount = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedVehicles = filteredVehicles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (loadStatus === "idle") dispatch(fetchVehicles());
  }, [dispatch, loadStatus]);

  function openAdd() {
    setDraft(emptyDraft);
    setError("");
    setDialog("add");
  }
  function openEdit(vehicle) {
    setDraft({
      name: vehicle.name,
      category: vehicle.category,
      id: vehicle.id,
      depot: vehicle.depot,
      type: vehicle.type === "Train" || vehicle.type === "2" ? "2" : "1",
      status: vehicle.status,
    });
    setError("");
    setDialog("edit");
  }
  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }
  async function saveVehicle(event) {
    event.preventDefault();
    const id = draft.id.trim().toUpperCase();
    if (!draft.name.trim() || !id || !draft.depot.trim()) {
      setError("Vehicle name, vehicle ID, and depot are required.");
      return;
    }
    if (
      dialog === "add" &&
      vehicles.some((vehicle) => vehicle.id.toLowerCase() === id.toLowerCase())
    ) {
      setError("A vehicle with this ID already exists.");
      return;
    }
    const payload = {
      name: draft.name.trim(),
      vehicleId: id,
      depot: draft.depot.trim(),
      type: Number(draft.type),
      status: draft.status,
    };
    try {
      await dispatch(dialog === "add" ? createVehicle(payload) : updateVehicle(payload)).unwrap();
      setDialog(null);
    } catch (saveError) {
      setError(saveError);
    }
  }
  function deleteVehicle(id) {
    setHiddenVehicleIds((current) => [...current, id]);
  }

  return (
    <div className="service-page vehicle-page">
      <header className="service-topbar">
        <div className="service-date-status">
          <span>
            <i /> LIVE FLEET
          </span>
          <small>{currentDate} · {servicePeriod} service</small>
        </div>
        <span className="manager-support">Manager support</span>
        <IconButton className="service-notification" aria-label="Notifications">
          <NotificationsNoneOutlinedIcon />
          <i />
        </IconButton>
      </header>
      <main className="service-content">
        <div className="service-heading">
          <div>
            <h1>Vehicle fleet management</h1>
            <p>
              Monitor fleet health, manage vehicle assignments, and keep
              operators on schedule.
            </p>
          </div>
          <Button className="add-service" startIcon={<AddOutlinedIcon />} onClick={openAdd}>Add vehicle</Button>
        </div>
        <section className="service-kpi-grid">
          <Kpi
            icon={<BusAlertOutlinedIcon />}
            label="Total vehicles"
            value={vehicles.length}
            detail={`${busCount} buses · ${trainCount} trains`}
          />
          <Kpi
            icon="✓"
            label="Buses"
            value={busCount}
          />
          <Kpi
            icon={<DirectionsBusOutlinedIcon />}
            label="Trains"
            value={trainCount}
          />
          <Kpi
            icon={<WarningAmberOutlinedIcon />}
            label="In maintenance"
            value={inMaintenanceCount}
            detail={`${inMaintenanceBusCount} buses · ${inMaintenanceTrainCount} trains`}
          />
        </section>
        <div className="vehicle-layout">
          <section className="services-table-panel vehicle-list-panel">
            <div className="panel-title-row">
              <div>
                <h2>Vehicles &amp; fleet</h2>
                <p>Live vehicle plan for {currentDate}</p>
              </div>
            </div>
            {loadStatus === "failed" && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => dispatch(fetchVehicles())}>Retry</Button>}>{loadError}</Alert>}
            <div className="service-table-tools">
              <TextField
                placeholder="Search vehicle or ID"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlinedIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <select
                aria-label="Filter by status"
                value={status}
                onChange={(event) => { setStatus(event.target.value); setPage(1); }}
              >
                <option>All</option>
                <option>Active</option>
                <option>Delayed</option>
                <option>Upcoming</option>
              </select>
              <button className="mode-button" type="button">
                Type&nbsp; All
              </button>
              <IconButton aria-label="More filters">
                <FilterListOutlinedIcon />
              </IconButton>
            </div>
            <div className="vehicle-tabs">
              <button className="selected-tab" type="button">
                  All vehicles · {vehicles.length}
              </button>
                <button type="button">Active · {activeCount}</button>
                <button type="button">Delayed · {delayedCount}</button>
                <button type="button">Upcoming · {upcomingCount}</button>
            </div>
            <div className="service-table-wrap">
              <table className="service-table vehicle-table">
                <thead>
                  <tr>
                    <th>VEHICLE</th>
                    <th>VEHICLE ID</th>
                    <th>DEPOT</th>
                    <th>TYPE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loadStatus === "loading" && <tr><td className="vehicle-empty-state" colSpan="6">Loading vehicles…</td></tr>}
                  {loadStatus !== "loading" && paginatedVehicles.map((vehicle) => (
                    <VehicleRow
                      key={vehicle.id}
                      vehicle={vehicle}
                      onEdit={openEdit}
                      onDelete={deleteVehicle}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="vehicle-pagination">
              <span>{filteredVehicles.length ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filteredVehicles.length)} of ${filteredVehicles.length}` : "Showing 0 vehicles"}</span>
              <div>
                <IconButton aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage((nextPage) => Math.max(1, nextPage - 1))}>
                  <ChevronLeftOutlinedIcon />
                </IconButton>
                <b>{currentPage}</b>
                <span>of {pageCount}</span>
                <IconButton aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage((nextPage) => Math.min(pageCount, nextPage + 1))}>
                  <ChevronRightOutlinedIcon />
                </IconButton>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Dialog
        open={Boolean(dialog)}
        onClose={() => setDialog(null)}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={saveVehicle}>
          <DialogTitle>
            {dialog === "edit" ? "Update vehicle" : "Add vehicle"}
          </DialogTitle>
          <DialogContent className="vehicle-form-fields">
            <TextField
              label="Vehicle name"
              value={draft.name}
              onChange={(event) => updateDraft("name", event.target.value)}
              autoFocus
            />
            <TextField
              label="Vehicle ID"
              value={draft.id}
              onChange={(event) => updateDraft("id", event.target.value)}
              disabled={dialog === "edit"}
            />
            <TextField
              label="Depot"
              value={draft.depot}
              onChange={(event) => updateDraft("depot", event.target.value)}
            />
            <TextField
              select
              label="Type"
              value={draft.type}
              onChange={(event) => updateDraft("type", event.target.value)}
            >
              <MenuItem value="1">Bus</MenuItem>
              <MenuItem value="2">Train</MenuItem>
            </TextField>
            <TextField
              select
              label="Status"
              value={draft.status}
              onChange={(event) => updateDraft("status", event.target.value)}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Delayed">Delayed</MenuItem>
              <MenuItem value="Short turn">Short turn</MenuItem>
              <MenuItem value="Upcoming">Upcoming</MenuItem>
              <MenuItem value="In Maintenance">In Maintenance</MenuItem>
            </TextField>
            {error && <p className="vehicle-form-error">{error}</p>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createStatus === "loading" || updateStatus === "loading"}>
              {createStatus === "loading" || updateStatus === "loading" ? "Saving..." : dialog === "edit" ? "Save changes" : "Add vehicle"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

function VehicleRow({ vehicle, onEdit, onDelete }) {
  const { name, category, id, depot, type, status } = vehicle;
  const tone = statusTone[status] || "mint";
  return (
    <tr>
      <th>
        <b>{name}</b>
        <small>{category}</small>
      </th>
      <td>
        <strong>{id}</strong>
      </td>
      <td>{depot}</td>
      <td>
        <strong>{type}</strong>
      </td>
      <td>
        <span className={`service-status status-${tone}`}>
          <i />
          {status}
        </span>
      </td>
      <td className="vehicle-actions">
        <IconButton aria-label={`Edit ${id}`} onClick={() => onEdit(vehicle)}>
          <EditOutlinedIcon />
        </IconButton>
        <IconButton aria-label={`Delete ${id}`} onClick={() => onDelete(id)}>
          <DeleteOutlineOutlinedIcon />
        </IconButton>
      </td>
    </tr>
  );
}
function Kpi({ icon, label, value, detail }) {
  return (
    <article className="service-kpi">
      <div className="service-kpi-head">
        <span className="service-kpi-icon">{icon}</span>
        <span>{label}</span>
        <b>
          <i /> LIVE
        </b>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
      <span className="kpi-bars">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    </article>
  );
}
export default VehicleManagementView;
