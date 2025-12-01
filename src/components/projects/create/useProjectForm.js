import { useState, useEffect, useRef } from "react";
import UsersApi from "../../../api/usersApi";
import TeamsApi from "../../../api/teamsApi";
import RoheApi from "../../../api/roheApi";
import HapuListsApi from "../../../api/hapulistsApi";

export const initialFormData = {
    name: "",
    start_date: "",
    end_date: "",
    owner: "",
    team_id: "",
    rohe: "",
    hapus: [],
    status: "0",
    description: "",
  };
  
  export const useProjectForm = () => {
    const formRef = useRef(null);
  
    const [form, setForm] = useState(initialFormData);
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [rohes, setRohes] = useState([]);
    const [hapus, setHapus] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
  
    const [loading, setLoading] = useState(false);
  
    // Load users, teams, rohe
    useEffect(() => {
      (async () => {
        try {
          const [u, t, r] = await Promise.all([
            UsersApi.list({ perpage: -1 }),
            TeamsApi.list({ perpage: -1 }),
            RoheApi.list({ perpage: -1 }),
          ]);
          setUsers(u?.data || []);
          setTeams(t?.data || []);
          setRohes(r?.data || []);
        } catch {}
      })();
    }, []);
  
    // Load hapu for rohe
    useEffect(() => {
      if (!form.rohe) return setHapus([]);
  
      (async () => {
        const json = await HapuListsApi.list({ rohe_id: form.rohe });
        setHapus(json?.data || []);
      })();
    }, [form.rohe]);
  
    // Load members for team
    useEffect(() => {
      if (!form.team_id) return setTeamMembers([]);
  
      (async () => {
        try {
          const json = await TeamsApi.getById(form.team_id);
          setTeamMembers(json?.data?.members || []);
        } catch {
          setTeamMembers([]);
        }
      })();
    }, [form.team_id]);
  
    const onChange = (e) => {
      const { name, value, multiple, options } = e.target;
  
      if (multiple) {
        const values = Array.from(options).filter((o) => o.selected).map((o) => o.value);
        return setForm((f) => ({ ...f, [name]: values }));
      }
  
      setForm((f) => ({ ...f, [name]: value }));
    };
  
    const addHapu = (id) => {
      if (!id || form.hapus.includes(id)) return;
      setForm((f) => ({ ...f, hapus: [...f.hapus, id] }));
    };
  
    const removeHapu = (id) => {
      setForm((f) => ({ ...f, hapus: f.hapus.filter((x) => x !== id) }));
    };
  
    return {
      form,
      setForm,
      formRef,
      users,
      teams,
      rohes,
      hapus,
      teamMembers,
      loading,
      setLoading,
      onChange,
      addHapu,
      removeHapu,
    };
  };
