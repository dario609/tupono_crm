export const ProjectsTableHeader = () => {
    return (
        <thead>
            <tr>
                <th>SN</th>
                <th>Project Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Project Owner</th>
                <th>Teams</th>
                <th>Rohe</th>
                <th>Hapū</th>
                <th>Status</th>
                <th style={{ width: 160, minWidth: 160 }} className="text-center">Actions</th>
            </tr>
        </thead>
    );
};

export default ProjectsTableHeader;