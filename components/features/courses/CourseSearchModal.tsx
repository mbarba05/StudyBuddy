import { colors } from "@/assets/colors";
import { BlueButton } from "@/components/ui/Buttons";
import { LoginInput, SearchBar } from "@/components/ui/TextInputs";
import { validateClassInput, validateProfName } from "@/lib/utillities";
import {
    Course,
    CourseProfDisplay,
    createNewCourse,
    getCoursesForSearch,
    getProfessorsForCourse,
    ProfessorForCourse,
} from "@/services/courseService";
import {
    createCourseProf,
    createProfessor,
    getProfessorsForSearch,
    ProfessorForSearch,
} from "@/services/professorService";
import { Ionicons } from "@expo/vector-icons";
import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Text, TouchableOpacity, View } from "react-native";

interface CourseSearchModalProps {
    visible: boolean;
    setVisible: Dispatch<SetStateAction<boolean>>;
    handleProfessorPicked: (courseProfId: CourseProfDisplay) => void;
    selectedCourseProf: CourseProfDisplay[];
}

const CourseSearchModal = ({
    visible,
    setVisible,
    handleProfessorPicked,
    selectedCourseProf,
}: CourseSearchModalProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [foundCourses, setFoundCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDebouncing, setIsDebouncing] = useState(false);
    const searchRef = useRef(0);
    const profSearchRef = useRef(0);
    const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
    const [professors, setProfessors] = useState<Record<number, ProfessorForCourse[]>>({});
    const [loadingProfId, setLoadingProfId] = useState<number | null>(null);
    const [addClassExpanded, setAddClassExpanded] = useState(false);
    const [newClassCode, setNewClassCode] = useState("");
    const [addOpenCourseId, setAddOpenCourseId] = useState<number | null>(null);
    const [profSearchQuery, setProfSearchQuery] = useState("");
    const [profSearchResults, setProfSearchResults] = useState<ProfessorForSearch[] | []>([]);

    //Debounced search for professors when add panel is open (shares loading/isDebouncing)
    useEffect(() => {
        if (!addOpenCourseId) {
            setProfSearchResults([]);
            return;
        }

        const q = profSearchQuery.trim();
        if (q.length < 3) {
            setProfSearchResults([]);
            return;
        }

        setIsDebouncing(true);
        const id = ++profSearchRef.current;

        const t = setTimeout(async () => {
            try {
                setIsDebouncing(false);
                setLoading(true);

                const results = await getProfessorsForSearch(q);
                if (profSearchRef.current === id) {
                    setProfSearchResults(results || []);
                }
            } finally {
                if (profSearchRef.current === id) {
                    setLoading(false);
                }
            }
        }, 500);

        return () => clearTimeout(t);
    }, [addOpenCourseId, profSearchQuery]);

    //Class search
    useEffect(() => {
        if (!searchTerm || searchTerm.length < 3) {
            setFoundCourses([]);
            setLoading(false);
            return;
        }

        setIsDebouncing(true);
        const id = ++searchRef.current;

        const timeoutId = setTimeout(async () => {
            try {
                setIsDebouncing(false);
                setLoading(true);
                const results = await getCoursesForSearch(searchTerm);
                if (searchRef.current === id) {
                    const selectedCodes = selectedCourseProf.map((item) => item.course_code);
                    setFoundCourses(results.filter((course) => !selectedCodes.includes(course.code)));
                    setExpandedCourseId(null);
                    setNewClassCode("");
                    setAddClassExpanded(false);
                    setAddOpenCourseId(null);
                    setProfSearchQuery("");
                    setProfSearchResults([]);
                }
            } finally {
                if (searchRef.current === id) setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedCourseProf]);

    const modalClose = useCallback(() => {
        setFoundCourses([]);
        setSearchTerm("");
        setLoading(false);
        setVisible(false);
        setExpandedCourseId(null);
        setAddClassExpanded(false);
        setNewClassCode("");
        setAddOpenCourseId(null);
        setProfSearchQuery("");
        setProfSearchResults([]);
    }, [setVisible]);

    const keyExtractor = useCallback((item: Course) => String(item.id), []);

    const submitNewClass = async (code: string) => {
        console.log("Submitting new class:", code);
        if (!validateClassInput(code)) {
            Alert.alert(
                "Please enter a valid input",
                "2-6 letters, followed by a space, followed by 1-3 digits, followed by 1 optional letter. Ex: CSCI 152E."
            );
            return;
        }
        const success = await createNewCourse(code);
        if (!success) return;
        setSearchTerm(code);
    };

    const ListEmptyComponent = useMemo(() => {
        const classAddPress = () => setAddClassExpanded(!addClassExpanded);

        if (!searchTerm)
            return <Text className="text-colors-textSecondary text-xl mt-6 text-center">Add your classes!</Text>;
        if (isDebouncing) return null;
        if (searchTerm.length < 3)
            return (
                <Text className="text-colors-textSecondary text-xl mt-6 text-center">Type at least 3 characters</Text>
            );
        if (loading) return <ActivityIndicator className="mt-6" />;

        return (
            <View className="flex items-center gap-4">
                <Text className="text-colors-textSecondary mt-6 text-xl text-center">No courses found.</Text>
                <TouchableOpacity onPress={classAddPress}>
                    <View className="flex flex-row items-center gap-1">
                        <Ionicons
                            name="caret-forward"
                            size={16}
                            color={colors.secondary}
                            style={{ transform: [{ rotate: addClassExpanded ? "90deg" : "0deg" }] }}
                        />
                        <Text className="text-colors-secondary text-xl">Can&apos;t find your course? Add it here</Text>
                    </View>
                </TouchableOpacity>
                {addClassExpanded && (
                    <View className="w-full gap-4 p-4 bg-colors-primary rounded-xl items-center border border-colors-text">
                        <Text className="text-colors-text text-xl self-start">Enter class code:</Text>
                        <LoginInput
                            autoCapitalize="characters"
                            autoCorrect={false}
                            value={newClassCode}
                            onChangeText={setNewClassCode}
                            placeholder="CSCI 152E"
                        />
                        <BlueButton onPress={() => submitNewClass(newClassCode)}>Submit</BlueButton>
                    </View>
                )}
            </View>
        );
    }, [searchTerm, isDebouncing, loading, addClassExpanded, newClassCode]);

    const listRenderItem = useCallback(
        ({ item }: { item: Course }) => {
            const expanded = expandedCourseId === item.id;
            const profList = professors[item.id] ?? [];
            const isLoading = loadingProfId === item.id;

            const handleCoursePress = async () => {
                if (expanded) {
                    setExpandedCourseId(null);
                    if (addOpenCourseId === item.id) {
                        setAddOpenCourseId(null);
                        setProfSearchQuery("");
                        setProfSearchResults([]);
                    }
                    return;
                }
                setExpandedCourseId(item.id);

                if (!professors[item.id]) {
                    setLoadingProfId(item.id);
                    const profs = await getProfessorsForCourse(item.id);
                    setProfessors((prev) => ({ ...prev, [item.id]: profs }));
                    setLoadingProfId(null);
                }
            };

            const handleAttachExistingProf = async (prof: ProfessorForSearch) => {
                const courseProfId = await createCourseProf(prof.id, item.id);

                if (!courseProfId) {
                    Alert.alert("Error adding professor to course", "Please try again later");
                    return;
                }

                const picked: CourseProfDisplay = {
                    course_code: item.code,
                    course_prof_id: courseProfId,
                    prof_name: prof.name,
                };

                handleProfessorPicked(picked);
                modalClose();
            };

            const handleAttachAndCreateProf = async () => {
                const name = profSearchQuery.trim();
                const validName = validateProfName(name);

                if (!validName) {
                    Alert.alert("Invalid Input", "Please enter a valid professor name.");
                    return;
                }
                const id = await createProfessor(name);

                if (!id) {
                    Alert.alert("Error creating professor", "Please try again later");
                    return;
                }

                return await handleAttachExistingProf({ name, id });
            };

            const addProfessorExpanded = expanded && addOpenCourseId === item.id;
            const hasSearch = profSearchQuery.trim().length >= 2;
            const noResults = hasSearch && !isDebouncing && !loading && profSearchResults.length === 0;

            return (
                <View>
                    {/* Main course row */}
                    <TouchableOpacity
                        className={`${!expanded && "border-b-2 border-colors-textSecondary"} py-4`}
                        onPress={handleCoursePress}
                    >
                        <View className="flex flex-row items-center gap-1">
                            <Ionicons
                                name="caret-forward"
                                size={16}
                                color={colors.text}
                                style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}
                            />
                            <Text className="text-xl color-colors-text font-semibold">{item.code}</Text>
                        </View>
                        {expanded && <Text className="text-xl color-colors-textSecondary">Choose Professor:</Text>}
                    </TouchableOpacity>

                    {/* Dropdown section */}
                    {expanded && (
                        <View className="flex flex-col items-center">
                            {isLoading ? (
                                <ActivityIndicator className="p-8" />
                            ) : profList.length === 0 ? (
                                <Text className="text-colors-textSecondary text-xl">No professors</Text>
                            ) : (
                                <View className="flex flex-row flex-wrap justify-center gap-2 py-2">
                                    {profList.map((prof) => (
                                        <TouchableOpacity
                                            key={prof.course_prof_id}
                                            className="rounded-lg p-4 bg-colors-secondary"
                                            onPress={() => {
                                                const courseProfDisplay: CourseProfDisplay = {
                                                    prof_name: prof.name,
                                                    course_code: item.code,
                                                    course_prof_id: prof.course_prof_id,
                                                };
                                                handleProfessorPicked(courseProfDisplay);
                                                modalClose();
                                            }}
                                        >
                                            <Text className="text-xl font-semibold text-colors-text">{prof.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <TouchableOpacity
                                className="flex flex-row items-center gap-1 mt-4"
                                onPress={() => {
                                    setAddOpenCourseId((prev) => (prev === item.id ? null : item.id));
                                    setProfSearchQuery("");
                                    setProfSearchResults([]);
                                }}
                            >
                                <Ionicons
                                    name="caret-forward"
                                    size={16}
                                    color={colors.secondary}
                                    style={{ transform: [{ rotate: addProfessorExpanded ? "90deg" : "0deg" }] }}
                                />
                                <Text className="text-xl text-colors-secondary">
                                    Don&apos;t see your Professor? Add them here
                                </Text>
                            </TouchableOpacity>

                            {addProfessorExpanded && (
                                <View className="mt-4 rounded-md w-full p-4 bg-colors-primary border border-colors-text">
                                    <Text className="text-xl text-colors-text mb-2">Search or add a new professor</Text>

                                    <SearchBar
                                        value={profSearchQuery}
                                        onChangeText={setProfSearchQuery}
                                        placeholder="Type at least 3 characters..."
                                        autoCorrect={false}
                                        autoCapitalize="words"
                                    />

                                    {isDebouncing ? null : loading ? (
                                        <ActivityIndicator className="mt-4" />
                                    ) : (
                                        <>
                                            {profSearchResults.length > 0 && (
                                                <View className="mt-4">
                                                    {profSearchResults.map((p) => (
                                                        <TouchableOpacity
                                                            key={p.id}
                                                            className="flex-row items-center justify-between p-4 rounded-lg mb-2 bg-colors-secondary"
                                                            onPress={() => handleAttachExistingProf(p)}
                                                        >
                                                            <Text className="text-colors-text font-semibold">
                                                                {p.name}
                                                            </Text>
                                                            <Ionicons
                                                                name="add-circle-outline"
                                                                size={20}
                                                                color={colors.text}
                                                            />
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            )}

                                            {noResults && (
                                                <View className="mt-4 flex items-center">
                                                    <Text className="text-colors-textSecondary mb-2">
                                                        No matches found.
                                                    </Text>
                                                    <TouchableOpacity
                                                        onPress={() => handleAttachAndCreateProf()}
                                                        className="flex-row items-center justify-between p-4 rounded-xl mb-2 bg-colors-secondary"
                                                    >
                                                        <Text className="text-colors-text font-semibold">{`Add "${profSearchQuery.trim()}" to ${
                                                            item.code
                                                        }`}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}

                                            {profSearchResults.length === 0 && !hasSearch && (
                                                <Text className="text-colors-textSecondary mt-2">
                                                    Start typing to search, or type a full name and tap the add button.
                                                </Text>
                                            )}
                                        </>
                                    )}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            );
        },
        [
            expandedCourseId,
            professors,
            loadingProfId,
            handleProfessorPicked,
            modalClose,
            addOpenCourseId,
            profSearchQuery,
            profSearchResults,
            isDebouncing,
            loading,
        ]
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            allowSwipeDismissal
            presentationStyle="formSheet"
            onRequestClose={modalClose}
            backdropColor={colors.background}
        >
            <View className="p-5">
                <SearchBar
                    autoCapitalize="characters"
                    autoCorrect={false}
                    onChangeText={setSearchTerm}
                    autoFocus
                    placeholder="Search for a course. ex: (CSCI40)"
                />
                <View>
                    <FlatList
                        keyExtractor={keyExtractor}
                        data={foundCourses}
                        renderItem={listRenderItem}
                        ListEmptyComponent={ListEmptyComponent}
                    />
                </View>
            </View>
        </Modal>
    );
};

export default CourseSearchModal;
