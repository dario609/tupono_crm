import React, { useEffect } from "react";

import { useEngagementTable } from "../../hooks/engagements/useEngagementTable";
import EngagementHeader from "../../components/engagements/index/engagementHeader";
import EngagementControls from "../../components/engagements/index/engagementControls";
import EngagementTable from "../../components/engagements/index/engagementTable";
import EngagementPagination from "../../components/engagements/index/engagementPagination";

import "../../styles/engagementTracker.css";

export default function EngagementTrackerPage() {

    const {
        rows, loading, page, perpage, total, search,
        setSearch, setPerpage, load, handleDelete, handleEdit, handleReport,
        pagesToShow, lastPage, handleView
    } = useEngagementTable();


    useEffect(() => {
        const delay = setTimeout(() => {
            if (search.trim() !== "") load({ page: 1 });
        }, 300);

        return () => clearTimeout(delay);
    }, [search]);


    const onSearchKeyDown = (e) => {
        if (e.key === "Enter") load({ page: 1 });
    };

    const handlePerpageChange = (e) => {
        const v = parseInt(e.target.value, 10);
        setPerpage(v);
        load({ perpage: v, page: 1 });
    };



    const showingStart = total === 0 ? 0 : (perpage === -1 ? 1 : (page - 1) * perpage + 1);
    const showingEnd = perpage === -1 ? total : Math.min(page * perpage, total);

    return (

        <div className="card mt-3">

            <EngagementHeader />

            <div className="row card-body pt-0">
                <div className="col-12 p-0">
                    <EngagementControls
                        perpage={perpage}
                        setPerpage={setPerpage}
                        search={search}
                        setSearch={setSearch}
                        onSearchKeyDown={onSearchKeyDown}
                        load={load}
                        handlePerpageChange={handlePerpageChange}
                    />

                    <EngagementTable
                        rows={rows}
                        loading={loading}
                        page={page}
                        perpage={perpage}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                        handleView={handleView}
                    />

                    {total > 0 && (
                        <EngagementPagination
                            page={page}
                            lastPage={lastPage}
                            pagesToShow={pagesToShow}
                            load={load}
                            total={total}
                            showingStart={showingStart}
                            showingEnd={showingEnd}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}