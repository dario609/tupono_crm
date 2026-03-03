export const buildProjectPayload = (form, tasks) => ({
    name: form.name,
    start_date: form.start_date ? new Date(form.start_date) : new Date(),
    end_date: form.end_date ? new Date(form.end_date) : new Date(),
    owner: form.owner || undefined,
    team_id: form.team_id || (form.teams && form.teams[0]) || undefined,
    teams: form.teams || [],
    rohe: form.rohe || undefined,
    hapus: form.hapus,
    status: form.status,
    description: form.description,
    tasks,
  });
  