import { useEffect, useState } from "react";
import api from "../api/axios";
import "./Customers.css";

interface Customer {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Facility {
  id: number;
  name: string;
  address: string;
  customer: Customer;
}

interface Equipment {
  id: number;
  name: string;
  equipmentCode: string;
  type: string;
  model: string;
  status: string;
}

function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [selectedFacility, setSelectedFacility] =
    useState<Facility | null>(null);

  // Facility form
  const [facilityName, setFacilityName] = useState("");
  const [facilityAddress, setFacilityAddress] = useState("");
  const [showFacilityForm, setShowFacilityForm] = useState(false);

  // Equipment form
  const [equipmentName, setEquipmentName] = useState("");
  const [equipmentCode, setEquipmentCode] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [equipmentModel, setEquipmentModel] = useState("");
  const [equipmentStatus, setEquipmentStatus] = useState("ACTIVE");
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await api.get("/api/users");

      const customerUsers = response.data.filter(
        (user: Customer) =>
          String(user.role).trim().toUpperCase() === "CUSTOMER"
      );

      setCustomers(customerUsers);
    } catch (error) {
      console.error("Failed to load customers:", error);
    }
  };

  const loadFacilities = async (customerId: number) => {
    try {
      const response = await api.get(
        `/api/facilities/customer/${customerId}`
      );

      setFacilities(response.data);
      setEquipment([]);
      setSelectedFacility(null);
      setShowEquipmentForm(false);
    } catch (error) {
      console.error("Failed to load facilities:", error);
    }
  };

  const loadEquipment = async (facilityId: number) => {
    try {
      const response = await api.get(
        `/api/equipment/facility/${facilityId}`
      );

      setEquipment(response.data);
    } catch (error) {
      console.error("Failed to load equipment:", error);
    }
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowFacilityForm(false);
    loadFacilities(customer.id);
  };

  const handleFacilityClick = (facility: Facility) => {
    setSelectedFacility(facility);
    setShowEquipmentForm(false);
    loadEquipment(facility.id);
  };

  const handleAddFacility = async () => {
    if (!selectedCustomer) {
      alert("Please select a customer first.");
      return;
    }

    if (!facilityName.trim() || !facilityAddress.trim()) {
      alert("Please enter facility name and address.");
      return;
    }

    try {
      await api.post("/api/facilities", null, {
        params: {
          name: facilityName,
          address: facilityAddress,
          customerId: selectedCustomer.id,
        },
      });

      alert("Facility added successfully.");

      setFacilityName("");
      setFacilityAddress("");
      setShowFacilityForm(false);

      await loadFacilities(selectedCustomer.id);
    } catch (error) {
      console.error("Failed to add facility:", error);
      alert("Failed to add facility.");
    }
  };

  const handleAddEquipment = async () => {
    if (!selectedFacility) {
      alert("Please select a facility first.");
      return;
    }

    if (
      !equipmentName.trim() ||
      !equipmentCode.trim() ||
      !equipmentType.trim() ||
      !equipmentModel.trim()
    ) {
      alert("Please fill all equipment fields.");
      return;
    }

    try {
      await api.post("/api/equipment", null, {
        params: {
          name: equipmentName,
          equipmentCode: equipmentCode,
          type: equipmentType,
          model: equipmentModel,
          status: equipmentStatus,
          facilityId: selectedFacility.id,
        },
      });

      alert("Equipment added successfully.");

      setEquipmentName("");
      setEquipmentCode("");
      setEquipmentType("");
      setEquipmentModel("");
      setEquipmentStatus("ACTIVE");
      setShowEquipmentForm(false);

      await loadEquipment(selectedFacility.id);
    } catch (error) {
      console.error("Failed to add equipment:", error);
      alert("Failed to add equipment.");
    }
  };

  return (
    <div className="customers-page">
      {/* Page Header */}
      <header className="customers-page__header">
        <div>
          <span className="customers-page__eyebrow">
            KEYSTONE / ADMINISTRATION
          </span>
          <h1>Customer Management</h1>
          <p>
            Manage customer accounts, facilities, and equipment.
          </p>
        </div>

        <div className="customers-page__header-count">
          <span>Total Customers</span>
          <strong>{customers.length}</strong>
        </div>
      </header>

      {/* Customers */}
      <section className="customers-section">
        <div className="customers-section__heading">
          <div>
            <h2>Customers</h2>
            <p>Select a customer to view their facilities.</p>
          </div>
          <span className="customers-section__count">
            {customers.length} {customers.length === 1 ? "customer" : "customers"}
          </span>
        </div>

        {customers.length === 0 ? (
          <div className="customers-empty">
            <div className="customers-empty__icon">👥</div>
            <h3>No customers found</h3>
            <p>Customer accounts will appear here when available.</p>
          </div>
        ) : (
          <div className="customers-grid">
            {customers.map((customer) => (
              <button
                type="button"
                key={customer.id}
                className={`customer-card ${
                  selectedCustomer?.id === customer.id
                    ? "customer-card--selected"
                    : ""
                }`}
                onClick={() => handleCustomerClick(customer)}
              >
                <span className="customer-card__avatar">
                  {customer.name?.charAt(0)?.toUpperCase() || "C"}
                </span>

                <span className="customer-card__details">
                  <strong>{customer.name}</strong>
                  <span>{customer.email}</span>
                  <small>View facilities →</small>
                </span>

                <span className="customer-card__arrow">›</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Facilities */}
      {selectedCustomer && (
        <section className="customers-section customers-section--nested">
          <div className="customers-section__heading">
            <div>
              <span className="customers-section__eyebrow">
                SELECTED CUSTOMER
              </span>
              <h2>Facilities of {selectedCustomer.name}</h2>
              <p>Choose a facility to view its equipment.</p>
            </div>

            <button
              type="button"
              className="customers-button customers-button--primary"
              onClick={() => setShowFacilityForm(!showFacilityForm)}
            >
              {showFacilityForm ? "Cancel" : "+ Add Facility"}
            </button>
          </div>

          {showFacilityForm && (
            <div className="customers-form">
              <div className="customers-form__heading">
                <h3>Add Facility</h3>
                <p>Enter the facility name and address.</p>
              </div>

              <div className="customers-form__fields">
                <label>
                  Facility Name
                  <input
                    type="text"
                    placeholder="e.g. Nashik Office"
                    value={facilityName}
                    onChange={(e) => setFacilityName(e.target.value)}
                  />
                </label>

                <label>
                  Address
                  <input
                    type="text"
                    placeholder="Enter facility address"
                    value={facilityAddress}
                    onChange={(e) => setFacilityAddress(e.target.value)}
                  />
                </label>
              </div>

              <div className="customers-form__actions">
                <button
                  type="button"
                  className="customers-button customers-button--primary"
                  onClick={handleAddFacility}
                >
                  Save Facility
                </button>
                <button
                  type="button"
                  className="customers-button customers-button--secondary"
                  onClick={() => setShowFacilityForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {facilities.length === 0 ? (
            <div className="customers-empty customers-empty--compact">
              <h3>No facilities found</h3>
              <p>Add a facility for this customer to get started.</p>
            </div>
          ) : (
            <div className="facilities-grid">
              {facilities.map((facility) => (
                <button
                  type="button"
                  key={facility.id}
                  className={`facility-card ${
                    selectedFacility?.id === facility.id
                      ? "facility-card--selected"
                      : ""
                  }`}
                  onClick={() => handleFacilityClick(facility)}
                >
                  <span className="facility-card__icon">⌂</span>
                  <span className="facility-card__details">
                    <strong>{facility.name}</strong>
                    <span>{facility.address}</span>
                    <small>
                      {selectedFacility?.id === facility.id
                        ? "Selected facility"
                        : "View equipment →"}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Equipment */}
      {selectedFacility && (
        <section className="customers-section customers-section--nested">
          <div className="customers-section__heading">
            <div>
              <span className="customers-section__eyebrow">
                SELECTED FACILITY
              </span>
              <h2>Equipment at {selectedFacility.name}</h2>
              <p>View and manage equipment registered at this facility.</p>
            </div>

            <button
              type="button"
              className="customers-button customers-button--primary"
              onClick={() => setShowEquipmentForm(!showEquipmentForm)}
            >
              {showEquipmentForm ? "Cancel" : "+ Add Equipment"}
            </button>
          </div>

          {showEquipmentForm && (
            <div className="customers-form">
              <div className="customers-form__heading">
                <h3>Add Equipment</h3>
                <p>Complete the equipment details below.</p>
              </div>

              <div className="customers-form__fields">
                <label>
                  Equipment Name
                  <input
                    type="text"
                    placeholder="e.g. Air Conditioner"
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                  />
                </label>

                <label>
                  Equipment Code
                  <input
                    type="text"
                    placeholder="e.g. AC-001"
                    value={equipmentCode}
                    onChange={(e) => setEquipmentCode(e.target.value)}
                  />
                </label>

                <label>
                  Equipment Type
                  <input
                    type="text"
                    placeholder="e.g. HVAC"
                    value={equipmentType}
                    onChange={(e) => setEquipmentType(e.target.value)}
                  />
                </label>

                <label>
                  Model
                  <input
                    type="text"
                    placeholder="Enter model"
                    value={equipmentModel}
                    onChange={(e) => setEquipmentModel(e.target.value)}
                  />
                </label>

                <label>
                  Status
                  <select
                    value={equipmentStatus}
                    onChange={(e) => setEquipmentStatus(e.target.value)}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </label>
              </div>

              <div className="customers-form__actions">
                <button
                  type="button"
                  className="customers-button customers-button--primary"
                  onClick={handleAddEquipment}
                >
                  Save Equipment
                </button>
                <button
                  type="button"
                  className="customers-button customers-button--secondary"
                  onClick={() => setShowEquipmentForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {equipment.length === 0 ? (
            <div className="customers-empty customers-empty--compact">
              <h3>No equipment found</h3>
              <p>Add equipment to this facility to see it listed here.</p>
            </div>
          ) : (
            <div className="equipment-grid">
              {equipment.map((item) => (
                <article className="equipment-card" key={item.id}>
                  <div className="equipment-card__top">
                    <span className="equipment-card__icon">⚙</span>
                    <span
                      className={`equipment-status equipment-status--${item.status
                        ?.toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <h3>{item.name}</h3>
                  <p className="equipment-card__code">
                    Code: {item.equipmentCode}
                  </p>

                  <div className="equipment-card__details">
                    <div>
                      <span>Type</span>
                      <strong>{item.type}</strong>
                    </div>
                    <div>
                      <span>Model</span>
                      <strong>{item.model}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Customers;