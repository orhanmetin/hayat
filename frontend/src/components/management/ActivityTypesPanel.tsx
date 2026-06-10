import React, { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { managementApi } from "../../services/modules";
import { TypeListPanel } from "./TypeListPanel";
import { StravaIntegrationPanel } from "./StravaIntegrationPanel";
import type { LookupType } from "../../types/modules";

export const ActivityTypesPanel: React.FC = () => {
  const [sportTypes, setSportTypes] = useState<LookupType[]>([]);
  const [deepWorkTypes, setDeepWorkTypes] = useState<LookupType[]>([]);
  const [meditationTypes, setMeditationTypes] = useState<LookupType[]>([]);
  const [newSport, setNewSport] = useState("");
  const [newDeepWork, setNewDeepWork] = useState("");
  const [newMeditation, setNewMeditation] = useState("");

  const load = async () => {
    const [sport, deep, meditation] = await Promise.all([
      managementApi.getSportTypes(),
      managementApi.getDeepWorkTypes(),
      managementApi.getMeditationTypes(),
    ]);
    setSportTypes(sport.data);
    setDeepWorkTypes(deep.data);
    setMeditationTypes(meditation.data);
  };

  useEffect(() => {
    load();
  }, []);

  const addSport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSport.trim()) return;
    await managementApi.createSportType(newSport.trim());
    setNewSport("");
    load();
  };

  const addDeepWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeepWork.trim()) return;
    await managementApi.createDeepWorkType(newDeepWork.trim());
    setNewDeepWork("");
    load();
  };

  const addMeditation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeditation.trim()) return;
    await managementApi.createMeditationType(newMeditation.trim());
    setNewMeditation("");
    load();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Layers size={20} className="text-primary" />
          Aktivite Türleri
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Spor, meditasyon ve deep work kayıtlarında kullanılacak alt türler
        </p>
      </div>

      <StravaIntegrationPanel />

      <div className="p-5 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5">
        <TypeListPanel
          title="Spor Aktivite Tipleri"
          items={sportTypes}
          newValue={newSport}
          onNewValueChange={setNewSport}
          onAdd={addSport}
          onDelete={async (id) => {
            await managementApi.deleteSportType(id);
            load();
          }}
        />
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5">
        <TypeListPanel
          title="Meditasyon Türleri"
          items={meditationTypes}
          newValue={newMeditation}
          onNewValueChange={setNewMeditation}
          onAdd={addMeditation}
          onDelete={async (id) => {
            await managementApi.deleteMeditationType(id);
            load();
          }}
        />
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5">
        <TypeListPanel
          title="Deep Work Türleri"
          items={deepWorkTypes}
          newValue={newDeepWork}
          onNewValueChange={setNewDeepWork}
          onAdd={addDeepWork}
          onDelete={async (id) => {
            await managementApi.deleteDeepWorkType(id);
            load();
          }}
        />
      </div>
    </div>
  );
};
