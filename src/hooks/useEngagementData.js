import { useState, useEffect } from "react";
import HapuListsApi from "../api/hapulistsApi";
import ProjectsApi from "../api/projectsApi";  
import { AuthApi } from "../api/authApi";

export const useEngagementData = () => {
    const [loading, setLoading] = useState(true);
    const [hapuList, setHapuList] = useState([]);
    const [projectList, setProjectList] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [hapusRes, projectsRes, authRes] =
                    await Promise.all([
                        HapuListsApi.list(),
                        ProjectsApi.list(),
                        AuthApi.check(),
                    ]);

                setHapuList(hapusRes?.data || []);
                setProjectList(projectsRes?.data || []);
                setCurrentUser(authRes?.user);  
            } catch (error) {
                console.error("Error loading engagement data:", error); 
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    return { loading, hapuList, projectList, currentUser };
};
