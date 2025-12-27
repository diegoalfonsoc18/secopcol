// Hook para usar DIVIPOLA en componentes React
import { useState, useEffect, useCallback } from "react";
import { getDepartments, getMunicipalities } from "../../services/divipola";

interface UseDivipolaReturn {
  departments: string[];
  municipalities: string[];
  loadingDepartments: boolean;
  loadingMunicipalities: boolean;
  selectedDepartment: string;
  selectedMunicipality: string;
  setSelectedDepartment: (dept: string) => void;
  setSelectedMunicipality: (muni: string) => void;
  reset: () => void;
}

export function useDivipola(): UseDivipolaReturn {
  const [departments, setDepartments] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");

  // Cargar departamentos al iniciar
  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepartments(true);
      const data = await getDepartments();
      setDepartments(data);
      setLoadingDepartments(false);
    };
    loadDepartments();
  }, []);

  // Cargar municipios cuando cambia el departamento
  useEffect(() => {
    if (!selectedDepartment) {
      setMunicipalities([]);
      setSelectedMunicipality("");
      return;
    }

    const loadMunicipalities = async () => {
      setLoadingMunicipalities(true);
      setSelectedMunicipality("");
      const data = await getMunicipalities(selectedDepartment);
      setMunicipalities(data);
      setLoadingMunicipalities(false);
    };
    loadMunicipalities();
  }, [selectedDepartment]);

  const reset = useCallback(() => {
    setSelectedDepartment("");
    setSelectedMunicipality("");
    setMunicipalities([]);
  }, []);

  return {
    departments,
    municipalities,
    loadingDepartments,
    loadingMunicipalities,
    selectedDepartment,
    selectedMunicipality,
    setSelectedDepartment,
    setSelectedMunicipality,
    reset,
  };
}

export default useDivipola;
