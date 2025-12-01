import ProjectsTableHeader from "./ProjectsTableHeader";
import ProjectsTableBody from "./ProjectsTableBody";

const ProjectsTable = ({
    loading,
    rows,
    page,
    perpage,
    handleDelete,
    navigate,
}) => {
    return (
        <div className="table-responsive">
            <table className="table table-striped">
                <ProjectsTableHeader />

                <ProjectsTableBody
                    loading={loading}
                    rows={rows}
                    page={page}
                    perpage={perpage}
                    handleDelete={handleDelete}
                    navigate={navigate}
                />
            </table>
        </div>
    );
};

export default ProjectsTable;
