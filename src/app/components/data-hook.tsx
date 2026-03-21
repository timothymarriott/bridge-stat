import { createContext, useContext } from "react";
import { DataContextType } from "./data-context";

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
	const context = useContext(DataContext);
	if (!context) {
		throw new Error("useData must be used within a DataProvider");
	}
	return context;
};
