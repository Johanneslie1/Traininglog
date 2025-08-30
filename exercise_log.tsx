import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/features/exercises/ExerciseLog.tsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=30aa4c64"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
let prevRefreshReg;
let prevRefreshSig;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = RefreshRuntime.getRefreshReg("C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx");
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}
var _s = $RefreshSig$();
import __vite__cjsImport3_react from "/node_modules/.vite/deps/react.js?v=30aa4c64"; const useState = __vite__cjsImport3_react["useState"]; const useEffect = __vite__cjsImport3_react["useEffect"]; const useCallback = __vite__cjsImport3_react["useCallback"];
import { SupersetProvider, useSupersets } from "/src/context/SupersetContext.tsx";
import { useNavigate } from "/node_modules/.vite/deps/react-router-dom.js?v=30aa4c64";
import { useSelector } from "/node_modules/.vite/deps/react-redux.js?v=30aa4c64";
import { ErrorBoundary } from "/src/components/ErrorBoundary.tsx";
import ProgramModal from "/src/features/programs/ProgramModal.tsx";
import { v4 as uuidv4 } from "/node_modules/.vite/deps/uuid.js?v=30aa4c64";
import LogOptions from "/src/features/exercises/LogOptions.tsx";
import { Calendar } from "/src/features/exercises/Calendar.tsx";
import { ExerciseSetLogger } from "/src/features/exercises/ExerciseSetLogger.tsx";
import WorkoutSummary from "/src/features/exercises/WorkoutSummary.tsx";
import { db } from "/src/services/firebase/config.ts";
import { collection, query, where, getDocs } from "/node_modules/.vite/deps/firebase_firestore.js?v=30aa4c64";
import { exportExerciseData } from "/src/utils/exportUtils.ts";
import { getExerciseLogsByDate, saveExerciseLog } from "/src/utils/localStorageUtils.ts";
import { saveLog } from "/src/services/firebase/unifiedLogs.ts";
import { importExerciseLogs } from "/src/utils/importUtils.ts";
import SideMenu from "/src/components/SideMenu.tsx";
import ExportModal from "/src/components/ExportModal.tsx";
import DraggableExerciseDisplay from "/src/components/DraggableExerciseDisplay.tsx";
import FloatingSupersetControls from "/src/components/FloatingSupersetControls.tsx";
import { getAllExercisesByDate, deleteExercise } from "/src/utils/unifiedExerciseUtils.ts";
import ExerciseTypeDebugger from "/src/components/debug/ExerciseTypeDebugger.tsx";
import { ActivityType } from "/src/types/activityTypes.ts";
import ExerciseTypeDebugger from "/src/components/debug/ExerciseTypeDebugger.tsx";
const ExerciseLogContent = () => {
  _s();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { removeExerciseFromSuperset, loadSupersetsForDate, saveSupersetsForDate } = useSupersets();
  const normalizeDate = useCallback((date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }, []);
  const areDatesEqual = useCallback((date1, date2) => {
    const normalized1 = normalizeDate(date1);
    const normalized2 = normalizeDate(date2);
    return normalized1.getTime() === normalized2.getTime();
  }, [normalizeDate]);
  const getDateRange = useCallback((date) => {
    const startOfDay = normalizeDate(date);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);
    return { startOfDay, endOfDay };
  }, [normalizeDate]);
  const [uiState, setUiState] = useState({
    showLogOptions: false,
    showCalendar: false,
    showSetLogger: false,
    showImportModal: false,
    showExportModal: false,
    showWorkoutSummary: false,
    showMenu: false,
    showProgramModal: false,
    showDebugger: false
  });
  const updateUiState = useCallback((key, value) => {
    setUiState((prev) => ({ ...prev, [key]: value }));
  }, []);
  const toggleCalendar = useCallback((show) => {
    updateUiState("showCalendar", show ?? !uiState.showCalendar);
  }, [uiState.showCalendar, updateUiState]);
  const [selectedDate, setSelectedDate] = useState(() => normalizeDate(/* @__PURE__ */ new Date()));
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const convertToExerciseData = useCallback((exercise, userId) => ({
    id: exercise.id ?? uuidv4(),
    exerciseName: exercise.exerciseName,
    sets: exercise.sets,
    timestamp: new Date(exercise.timestamp),
    userId,
    deviceId: exercise.deviceId || localStorage.getItem("device_id") || ""
  }), []);
  const loadExercises = useCallback(async (date) => {
    const userId = user?.id;
    if (!userId) {
      setLoading(false);
      setExercises([]);
      return;
    }
    const loadedDate = normalizeDate(date);
    setLoading(true);
    const dateString = loadedDate.toISOString().split("T")[0];
    loadSupersetsForDate(dateString);
    try {
      const allExercises = await getAllExercisesByDate(loadedDate, userId);
      const { startOfDay, endOfDay } = getDateRange(loadedDate);
      const q = query(
        collection(db, "users", userId, "exercises"),
        where("timestamp", ">=", startOfDay),
        where("timestamp", "<=", endOfDay)
      );
      const snapshot = await getDocs(q);
      const firebaseExercises = snapshot.docs.map((doc) => {
        const data = doc.data();
        return convertToExerciseData({
          id: doc.id,
          exerciseName: data.exerciseName,
          sets: data.sets,
          timestamp: data.timestamp.toDate(),
          deviceId: data.deviceId
        }, userId);
      });
      const uniqueFirebaseExercises = firebaseExercises.filter(
        (fEx) => !allExercises.some((ex) => ex.id === fEx.id)
      );
      const combinedExercises = [...allExercises, ...uniqueFirebaseExercises];
      combinedExercises.sort((a, b) => {
        if (a.timestamp instanceof Date && b.timestamp instanceof Date) {
          return a.timestamp.getTime() - b.timestamp.getTime();
        }
        return 0;
      });
      setExercises(combinedExercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      try {
        const allExercises = await getAllExercisesByDate(loadedDate, userId);
        setExercises(allExercises);
      } catch (fallbackError) {
        console.error("Error in fallback:", fallbackError);
        const localExercises = getExerciseLogsByDate(loadedDate).map((exercise) => convertToExerciseData(exercise, userId));
        setExercises(localExercises);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, areDatesEqual, normalizeDate, getDateRange, convertToExerciseData, loadSupersetsForDate]);
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(/* @__PURE__ */ new Date());
    }
  }, [selectedDate]);
  const handleDateSelect = useCallback(async (date) => {
    const normalized = normalizeDate(date);
    if (!normalized) return;
    setLoading(true);
    setSelectedDate(normalized);
    await loadExercises(normalized);
    toggleCalendar(false);
  }, [normalizeDate, loadExercises, toggleCalendar]);
  useEffect(() => {
    if (user?.id) {
      loadExercises(selectedDate);
    }
  }, [user?.id, loadExercises, selectedDate]);
  const handleExerciseSelect = useCallback((_selectedExercises) => {
    toggleCalendar(false);
  }, [toggleCalendar]);
  const handleCloseSetLogger = useCallback(() => {
    setSelectedExercise(null);
    updateUiState("showSetLogger", false);
  }, [updateUiState]);
  const handleSaveSets = useCallback(async (sets, exerciseId) => {
    if (!selectedExercise || !user?.id) {
      console.error("Cannot save sets: missing exercise or user");
      return;
    }
    try {
      console.log("💾 Saving sets for exercise:", {
        exerciseId,
        exerciseName: selectedExercise.exerciseName,
        setCount: sets.length
      });
      const updatedExercise = {
        ...selectedExercise,
        id: exerciseId || uuidv4(),
        // Ensure ID is always present
        sets,
        timestamp: selectedDate
      };
      // Save via unified saveLog (routes to strengthExercises)
      const firestoreId = await saveLog(
        {
          exerciseName: updatedExercise.exerciseName,
          userId: user.id,
          sets,
          exerciseType: 'strength'
        },
        selectedDate,
        updatedExercise.id
        // Pass existing ID if we have one
      );
      console.log("✅ Exercise saved to Firestore successfully");
      await saveExerciseLog({
        ...updatedExercise,
        id: firestoreId,
        userId: user.id
      });
      console.log("✅ Exercise saved to local storage");
      handleCloseSetLogger();
      await loadExercises(selectedDate);
    } catch (error) {
      console.error("❌ Error saving exercise sets:", error);
      alert("Failed to save exercise sets. Please try again.");
    }
  }, [selectedExercise, user, selectedDate, handleCloseSetLogger, loadExercises]);
  const handleDeleteExercise = async (exercise) => {
    if (!user?.id) {
      console.error("Cannot delete exercise: missing user ID", { userId: user?.id });
      alert("Cannot delete exercise: user not authenticated");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this exercise?")) {
      return;
    }
    setExercises((prev) => prev.filter((ex) => ex.id !== exercise.id));
    try {
      console.log("🗑️ Attempting to delete exercise:", {
        exerciseId: exercise.id,
        userId: user.id,
        exerciseName: exercise.exerciseName,
        timestamp: exercise.timestamp,
        activityType: exercise.activityType
      });
      const deleteResult = await deleteExercise(exercise, user.id);
      if (deleteResult) {
        console.log("✅ Exercise deleted successfully");
        if (exercise.id) {
          removeExerciseFromSuperset(exercise.id);
        }
        await loadExercises(selectedDate);
      } else {
        throw new Error("Delete operation returned false");
      }
    } catch (error) {
      console.error("❌ Error deleting exercise:", error);
      setExercises((prev) => [...prev, exercise]);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to delete exercise: ${errorMessage}`);
      await loadExercises(selectedDate);
    }
  };
  const handleExport = useCallback(async (startDate, endDate, format = "both") => {
    try {
      await exportExerciseData(void 0, startDate, endDate, format);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    }
  }, []);
  const handleEditExercise = (exercise) => {
    const unifiedExercise = exercise;
    if (unifiedExercise.activityType && unifiedExercise.activityType !== ActivityType.RESISTANCE) {
      setEditingExercise(unifiedExercise);
      updateUiState("showLogOptions", true);
    } else {
      setSelectedExercise(exercise);
      updateUiState("showSetLogger", true);
    }
  };
  const handleReorderExercises = useCallback((reorderedExercises) => {
    setExercises(reorderedExercises);
    const dateString = selectedDate.toISOString().split("T")[0];
    const baseTime = new Date(selectedDate);
    baseTime.setHours(12, 0, 0, 0);
    reorderedExercises.forEach((exercise, index) => {
      if (!exercise.id || !user?.id) return;
      const newTimestamp = new Date(baseTime);
      newTimestamp.setMilliseconds(index * 100);
      const updatedExercise = {
        ...exercise,
        timestamp: newTimestamp,
        userId: user.id,
        id: exercise.id
        // Ensure ID is present and not undefined
      };
      saveExerciseLog(updatedExercise);
    });
    saveSupersetsForDate(dateString);
    console.log("✅ Exercise order saved");
  }, [selectedDate, user, saveSupersetsForDate]);
  const formatDate = useCallback((date) => {
    if (!date) return "";
    return date.toLocaleDateString("no-NO", {
      day: "numeric",
      month: "long"
    }).toLowerCase();
  }, []);
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;
    try {
      const logs = await importExerciseLogs(file);
      if (logs && logs.length > 0) {
        setExercises(
          (prevExercises) => [
            ...prevExercises,
            ...logs.map((log) => convertToExerciseData(log, user.id))
          ]
        );
      }
      updateUiState("showImportModal", false);
    } catch (error) {
      console.error("Error importing data:", error);
    }
  };
  useEffect(() => {
    if (user?.id && selectedDate) {
      const timeoutId = setTimeout(() => {
        loadExercises(selectedDate);
      }, 50);
      return () => clearTimeout(timeoutId);
    } else {
      setExercises([]);
      setLoading(false);
    }
  }, [selectedDate, user?.id]);
  useEffect(() => {
    if (selectedExercise && !areDatesEqual(selectedExercise.timestamp, selectedDate)) {
      handleCloseSetLogger();
    }
  }, [selectedDate, selectedExercise, areDatesEqual, handleCloseSetLogger]);
  useEffect(() => {
    console.log("Auth state:", {
      isAuthenticated: !!user,
      userId: user?.id,
      hasRequiredFields: user ? {
        hasId: !!user.id,
        hasEmail: !!user.email,
        hasFirstName: !!user.firstName,
        hasLastName: !!user.lastName,
        hasRole: !!user.role
      } : null
    });
  }, [user]);
  return /* @__PURE__ */ jsxDEV("div", { className: "relative min-h-screen bg-black", children: [
    /* @__PURE__ */ jsxDEV("header", { className: "flex items-center justify-between px-4 py-4 bg-black/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 border-b border-white/10", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            className: "p-2 hover:bg-white/10 rounded-lg transition-colors",
            onClick: () => setUiState((prev) => ({ ...prev, showMenu: true })),
            "aria-label": "Open menu",
            children: /* @__PURE__ */ jsxDEV("svg", { className: "w-6 h-6 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }, void 0, false, {
              fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
              lineNumber: 490,
              columnNumber: 15
            }, this) }, void 0, false, {
              fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
              lineNumber: 489,
              columnNumber: 13
            }, this)
          },
          void 0,
          false,
          {
            fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
            lineNumber: 484,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("h1", { className: "text-white text-xl font-medium", children: formatDate(selectedDate) }, void 0, false, {
          fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
          lineNumber: 493,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 483,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center", children: [
        "          ",
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => toggleCalendar(),
            className: `p-2 rounded-lg transition-colors ${uiState.showCalendar ? "bg-white/10" : "hover:bg-white/10"}`,
            "aria-label": "Open calendar",
            "aria-expanded": uiState.showCalendar,
            children: /* @__PURE__ */ jsxDEV("svg", { className: "w-6 h-6 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }, void 0, false, {
              fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
              lineNumber: 503,
              columnNumber: 15
            }, this) }, void 0, false, {
              fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
              lineNumber: 502,
              columnNumber: 13
            }, this)
          },
          void 0,
          false,
          {
            fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
            lineNumber: 496,
            columnNumber: 54
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 496,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
      lineNumber: 482,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("main", { className: "px-4 pb-24 pt-20", children: /* @__PURE__ */ jsxDEV("div", { className: "relative flex flex-col h-full", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center mb-4", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-bold text-white", children: [
          "Exercise Log - ",
          selectedDate.toLocaleDateString()
        ] }, void 0, true, {
          fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
          lineNumber: 513,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => toggleCalendar(),
            className: "px-4 py-2 text-white rounded-lg transition-colors",
            "aria-label": "Toggle calendar",
            "aria-expanded": uiState.showCalendar,
            children: uiState.showCalendar ? "Hide Calendar" : "Show Calendar"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
            lineNumber: 516,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 512,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex-grow", children: loading ? /* @__PURE__ */ jsxDEV("div", { className: "flex justify-center items-center h-32", children: /* @__PURE__ */ jsxDEV("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B5CF6]" }, void 0, false, {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 528,
        columnNumber: 17
      }, this) }, void 0, false, {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 527,
        columnNumber: 13
      }, this) : exercises.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "text-center py-8 text-gray-400", children: [
        /* @__PURE__ */ jsxDEV("p", { className: "text-lg", children: "No exercises logged for this date" }, void 0, false, {
          fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
          lineNumber: 532,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => updateUiState("showLogOptions", true),
            className: "mt-4 px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg transition-colors",
            children: "Add Exercise"
          },
          void 0,
          false,
          {
            fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
            lineNumber: 533,
            columnNumber: 17
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 531,
        columnNumber: 13
      }, this) : /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: /* @__PURE__ */ jsxDEV(
        DraggableExerciseDisplay,
        {
          exercises,
          onEditExercise: handleEditExercise,
          onDeleteExercise: handleDeleteExercise,
          onReorderExercises: handleReorderExercises
        },
        void 0,
        false,
        {
          fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
          lineNumber: 543,
          columnNumber: 17
        },
        this
      ) }, void 0, false, {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 541,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 525,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
      lineNumber: 511,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
      lineNumber: 510,
      columnNumber: 7
    }, this),
    uiState.showCalendar && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-black/90 z-50", children: [
      "          ",
      /* @__PURE__ */ jsxDEV(
        Calendar,
        {
          onClose: () => toggleCalendar(false),
          onSelectExercises: handleExerciseSelect,
          onDateSelect: handleDateSelect,
          selectedDate
        },
        void 0,
        false,
        {
          fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
          lineNumber: 557,
          columnNumber: 65
        },
        this
      )
    ] }, void 0, true, {
      fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
      lineNumber: 557,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "fixed bottom-6 right-6 z-50", children: /* @__PURE__ */ jsxDEV(
      "button",
      {
        onClick: () => updateUiState("showLogOptions", true),
        className: "w-16 h-16 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-full flex items-center justify-center text-white shadow-lg transition-colors",
        "aria-label": "Add Exercise",
        children: /* @__PURE__ */ jsxDEV("svg", { className: "w-8 h-8", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4v16m8-8H4" }, void 0, false, {
          fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
          lineNumber: 574,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
          lineNumber: 573,
          columnNumber: 11
        }, this)
      },
      void 0,
      false,
      {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 568,
        columnNumber: 9
      },
      this
    ) }, void 0, false, {
      fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
      lineNumber: 567,
      columnNumber: 7
    }, this),
    uiState.showProgramModal && /* @__PURE__ */ jsxDEV(
      ProgramModal,
      {
        isOpen: uiState.showProgramModal,
        onClose: () => setUiState((prev) => ({ ...prev, showProgramModal: false })),
        onSave: () => setUiState((prev) => ({ ...prev, showProgramModal: false }))
      },
      void 0,
      false,
      {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 580,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(
      ExportModal,
      {
        isOpen: uiState.showExportModal,
        onClose: () => updateUiState("showExportModal", false),
        onExport: handleExport
      },
      void 0,
      false,
      {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 588,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV(FloatingSupersetControls, {}, void 0, false, {
      fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
      lineNumber: 596,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV(
      SideMenu,
      {
        isOpen: uiState.showMenu,
        onClose: () => updateUiState("showMenu", false),
        onImport: () => updateUiState("showImportModal", true),
        onExport: () => updateUiState("showExportModal", true),
        onShowWorkoutSummary: () => updateUiState("showWorkoutSummary", true),
        onNavigateToday: () => setSelectedDate(/* @__PURE__ */ new Date()),
        onNavigatePrograms: () => {
          navigate("/programs");
        },
        onNavigateExercises: () => {
          navigate("/exercises");
        }
      },
      void 0,
      false,
      {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 598,
        columnNumber: 7
      },
      this
    ),
    uiState.showLogOptions && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-black/90 z-50", children: /* @__PURE__ */ jsxDEV(
      LogOptions,
      {
        onClose: () => {
          updateUiState("showLogOptions", false);
          setEditingExercise(null);
        },
        onExerciseAdded: () => {
          loadExercises(selectedDate);
          setEditingExercise(null);
        },
        selectedDate,
        editingExercise
      },
      void 0,
      false,
      {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 612,
        columnNumber: 11
      },
      this
    ) }, void 0, false, {
      fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
      lineNumber: 611,
      columnNumber: 7
    }, this),
    uiState.showSetLogger && selectedExercise && selectedExercise.id && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-black/90 z-50", children: /* @__PURE__ */ jsxDEV(
      ExerciseSetLogger,
      {
        exercise: {
          id: selectedExercise.id,
          name: selectedExercise.exerciseName,
          sets: selectedExercise.sets.map((set) => ({
            reps: set.reps,
            weight: set.weight || 0,
            difficulty: set.difficulty
          }))
        },
        onSave: handleSaveSets,
        onCancel: () => updateUiState("showSetLogger", false),
        isEditing: true,
        previousSet: selectedExercise.sets.length > 0 ? selectedExercise.sets[selectedExercise.sets.length - 1] : void 0,
        showPreviousSets: true,
        useExerciseId: true
      },
      void 0,
      false,
      {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 630,
        columnNumber: 11
      },
      this
    ) }, void 0, false, {
      fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
      lineNumber: 629,
      columnNumber: 7
    }, this),
    uiState.showImportModal && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50", children: /* @__PURE__ */ jsxDEV("div", { className: "bg-[#1a1a1a] rounded-xl p-6 max-w-md w-full border border-white/10", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-xl text-white font-medium", children: "Import Exercise Data" }, void 0, false, {
          fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
          lineNumber: 655,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => updateUiState("showImportModal", false),
            className: "p-2 hover:bg-white/10 rounded-lg transition-colors",
            children: /* @__PURE__ */ jsxDEV("svg", { className: "w-5 h-5 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }, void 0, false, {
              fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
              lineNumber: 661,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
              lineNumber: 660,
              columnNumber: 17
            }, this)
          },
          void 0,
          false,
          {
            fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
            lineNumber: 656,
            columnNumber: 15
          },
          this
        )
      ] }, void 0, true, {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 654,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-gray-300 mb-4", children: "Select a JSON backup file to import your exercise data." }, void 0, false, {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 665,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "mb-6", children: /* @__PURE__ */ jsxDEV(
        "input",
        {
          type: "file",
          accept: ".json",
          onChange: handleFileUpload,
          className: "block w-full text-white p-3 rounded-xl bg-[#2a2a2a] border border-white/10 focus:outline-none focus:border-[#8B5CF6]"
        },
        void 0,
        false,
        {
          fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
          lineNumber: 669,
          columnNumber: 15
        },
        this
      ) }, void 0, false, {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 668,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => updateUiState("showImportModal", false),
          className: "px-6 py-3 bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-colors",
          children: "Cancel"
        },
        void 0,
        false,
        {
          fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
          lineNumber: 677,
          columnNumber: 15
        },
        this
      ) }, void 0, false, {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 676,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
      lineNumber: 653,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
      lineNumber: 652,
      columnNumber: 7
    }, this),
    uiState.showWorkoutSummary && exercises.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 bg-black/90 z-50", children: /* @__PURE__ */ jsxDEV(
      WorkoutSummary,
      {
        exercises: exercises.map((ex) => ({
          id: ex.id || "temp-id",
          exerciseName: ex.exerciseName,
          sets: ex.sets,
          timestamp: ex.timestamp
        })),
        onClose: () => updateUiState("showWorkoutSummary", false)
      },
      void 0,
      false,
      {
        fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
        lineNumber: 691,
        columnNumber: 11
      },
      this
    ) }, void 0, false, {
      fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
      lineNumber: 690,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
    lineNumber: 480,
    columnNumber: 5
  }, this);
};
_s(ExerciseLogContent, "fhK7FMlWLTSOfN6XkXabJzMfbi8=", false, function() {
  return [useNavigate, useSelector, useSupersets];
});
_c = ExerciseLogContent;
const ExerciseLog = () => {
  return /* @__PURE__ */ jsxDEV(ErrorBoundary, { fallback: /* @__PURE__ */ jsxDEV("div", { className: "text-white p-4", children: "Error loading exercises. Please try again." }, void 0, false, {
    fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
    lineNumber: 708,
    columnNumber: 30
  }, this), children: /* @__PURE__ */ jsxDEV(SupersetProvider, { children: /* @__PURE__ */ jsxDEV(ExerciseLogContent, {}, void 0, false, {
    fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
    lineNumber: 710,
    columnNumber: 9
  }, this) }, void 0, false, {
    fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
    lineNumber: 709,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx",
    lineNumber: 708,
    columnNumber: 5
  }, this);
};
_c2 = ExerciseLog;
export default ExerciseLog;
var _c, _c2;
$RefreshReg$(_c, "ExerciseLogContent");
$RefreshReg$(_c2, "ExerciseLog");
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}
if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/johan/OneDrive/Dokumenter/MinTrening/Loggføringsapp/APP/src/features/exercises/ExerciseLog.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}