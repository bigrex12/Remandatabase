import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { FilterBar } from './components/FilterBar';
import { RepairTable } from './components/RepairTable';
import { NewRepairModal } from './components/NewRepairModal';
import { ReturnCheckInModal } from './components/ReturnCheckInModal';
import { DeployFromFloatModal } from './components/DeployFromFloatModal';
import { MysteryPartLookupModal } from './components/MysteryPartLookupModal';
import { RepairDetailModal } from './components/RepairDetailModal';
import { PrintTagModal } from './components/PrintTagModal';
import { FarmerSyncModal } from './components/FarmerSyncModal';
import { VendorManagerModal } from './components/VendorManagerModal';
import { TechnicianManagerModal } from './components/TechnicianManagerModal';
import { BillingModal } from './components/BillingModal';
import { 
  fetchStats, 
  fetchRepairs, 
  fetchFarmers, 
  fetchVendors, 
  fetchTechnicians, 
  fetchSyncStatus, 
  triggerFarmerSync 
} from './utils/api';

export function App() {
  // Primary State
  const [repairs, setRepairs] = useState([]);
  const [stats, setStats] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [technician, setTechnician] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals State
  const [isNewRepairOpen, setIsNewRepairOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [isMysteryLookupOpen, setIsMysteryLookupOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

  // Selected Item for Modals
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [selectedRepairId, setSelectedRepairId] = useState(null);

  // Load all initial directory data on App Load
  const loadInitialData = async () => {
    try {
      const [farmersData, vendorsData, techsData, statusData] = await Promise.all([
        fetchFarmers(),
        fetchVendors(),
        fetchTechnicians().catch(() => []),
        fetchSyncStatus().catch(() => null)
      ]);
      setFarmers(farmersData);
      setVendors(vendorsData);
      setTechnicians(techsData);
      setSyncStatus(statusData);
    } catch (err) {
      console.error('Error loading initial directory data:', err);
    }
  };

  // Load filtered repairs & stats
  const loadRepairsAndStats = async () => {
    setLoading(true);
    try {
      const [repairsData, statsData] = await Promise.all([
        fetchRepairs({
          tab: activeTab,
          search,
          vendor_id: vendorId,
          technician,
          date_from: dateFrom,
          date_to: dateTo,
        }),
        fetchStats().catch(() => null)
      ]);
      setRepairs(repairsData);
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error('Error loading repairs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadRepairsAndStats();
  }, [activeTab, search, vendorId, technician, dateFrom, dateTo]);

  // Handlers for modal triggers
  const handleOpenDetail = (id) => {
    setSelectedRepairId(id);
    setIsDetailOpen(true);
  };

  const handleOpenCheckIn = (repair) => {
    setSelectedRepair(repair);
    setIsCheckInOpen(true);
  };

  const handleOpenDeploy = (repair) => {
    setSelectedRepair(repair);
    setIsDeployOpen(true);
  };

  const handleOpenBilling = (repair) => {
    setSelectedRepair(repair);
    setIsBillingModalOpen(true);
  };

  const handleOpenPrint = (repair) => {
    setSelectedRepair(repair);
    setIsPrintOpen(true);
  };

  const handleExportCsv = () => {
    window.open('/api/repairs/export/csv', '_blank');
  };

  const handleResetFilters = () => {
    setSearch('');
    setVendorId('');
    setTechnician('');
    setDateFrom('');
    setDateTo('');
  };

  const handleQuickSync = async () => {
    try {
      await triggerFarmerSync();
      const updatedFarmers = await fetchFarmers();
      const statusData = await fetchSyncStatus();
      setFarmers(updatedFarmers);
      setSyncStatus(statusData);
    } catch (err) {
      console.error('Quick sync failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 flex flex-col selection:bg-indigo-600 selection:text-white">
      
      {/* Top Header matching reference screenshot */}
      <Header
        syncStatus={syncStatus}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenVendorModal={() => setIsVendorModalOpen(true)}
        onOpenTechModal={() => setIsTechModalOpen(true)}
        onOpenNewRepairModal={() => setIsNewRepairOpen(true)}
        onOpenMysteryLookup={() => setIsMysteryLookupOpen(true)}
        onQuickSync={handleQuickSync}
      />

      {/* Main Content Area */}
      <main className="max-w-[1400px] mx-auto w-full px-6 py-6 space-y-6 flex-1">
        
        {/* Metric Summary Cards matching screenshot */}
        <MetricCards
          stats={stats}
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
        />

        {/* Search & Multi-Filter Bar */}
        <FilterBar
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          search={search}
          onSearchChange={setSearch}
          vendorId={vendorId}
          onVendorChange={setVendorId}
          technician={technician}
          onTechChange={setTechnician}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          vendors={vendors}
          technicians={technicians}
          onExportCsv={handleExportCsv}
          onResetFilters={handleResetFilters}
        />

        {/* Streamlined Data Table matching screenshot */}
        <RepairTable
          repairs={repairs}
          loading={loading}
          onSelectRepair={handleOpenDetail}
          onOpenCheckInModal={handleOpenCheckIn}
          onOpenDeployModal={handleOpenDeploy}
          onOpenBillingModal={handleOpenBilling}
          onOpenPrintModal={handleOpenPrint}
        />
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-[#2A3750] py-4.5 px-6 text-center text-xs font-medium text-slate-400 bg-[#0E1626]">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>KAEBS Wakarusa • Real-time order insights & lookup</span>
          <span className="text-slate-300">Google Sheet (WAKA) Sync Connected</span>
        </div>
      </footer>

      {/* Modals */}
      <NewRepairModal
        isOpen={isNewRepairOpen}
        onClose={() => setIsNewRepairOpen(false)}
        farmers={farmers}
        vendors={vendors}
        technicians={technicians}
        onRepairCreated={() => {
          loadRepairsAndStats();
        }}
        onRefreshFarmers={handleQuickSync}
      />

      <ReturnCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        repair={selectedRepair}
        farmers={farmers}
        onCheckInCompleted={() => {
          loadRepairsAndStats();
        }}
      />

      <DeployFromFloatModal
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
        repair={selectedRepair}
        farmers={farmers}
        technicians={technicians}
        onDeployCompleted={() => {
          loadRepairsAndStats();
        }}
      />

      <MysteryPartLookupModal
        isOpen={isMysteryLookupOpen}
        onClose={() => setIsMysteryLookupOpen(false)}
        vendors={vendors}
        onSelectForCheckIn={(item) => {
          handleOpenCheckIn(item);
        }}
      />

      <RepairDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        repairId={selectedRepairId}
        onOpenCheckInModal={handleOpenCheckIn}
        onOpenDeployModal={handleOpenDeploy}
        onOpenBillingModal={handleOpenBilling}
        onOpenPrintModal={handleOpenPrint}
        onRepairUpdated={() => {
          loadRepairsAndStats();
        }}
      />

      <PrintTagModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        repair={selectedRepair}
      />

      <FarmerSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncComplete={async () => {
          const updatedFarmers = await fetchFarmers();
          const statusData = await fetchSyncStatus();
          setFarmers(updatedFarmers);
          setSyncStatus(statusData);
          loadRepairsAndStats();
        }}
      />

      <VendorManagerModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        vendors={vendors}
        onVendorsUpdated={async () => {
          const updatedVendors = await fetchVendors();
          setVendors(updatedVendors);
          loadRepairsAndStats();
        }}
      />

      <TechnicianManagerModal
        isOpen={isTechModalOpen}
        onClose={() => setIsTechModalOpen(false)}
        technicians={technicians}
        onTechniciansUpdated={async () => {
          const updatedTechs = await fetchTechnicians();
          setTechnicians(updatedTechs);
          loadRepairsAndStats();
        }}
      />

      <BillingModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        repair={selectedRepair}
        onBillingUpdated={() => {
          loadRepairsAndStats();
        }}
      />

    </div>
  );
}

export default App;
