import React, { useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

// Testing import resolution

const DebugPage = () => {
    return (
        <div className="p-10">
            <h1>Debug Map</h1>
            <ComposableMap projectionConfig={{ scale: 100 }} width={800} height={400} style={{ width: "100%", height: "auto" }}>
                <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
                    {({ geographies }) =>
                        geographies.map((geo) => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="#DDD"
                                stroke="#FFF"
                                strokeWidth={0.5}
                            />
                        ))
                    }
                </Geographies>
            </ComposableMap>
        </div>
    );
};

export default DebugPage;
