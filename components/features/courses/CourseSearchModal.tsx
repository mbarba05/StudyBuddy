import { colors } from "@/assets/colors";
import { RedButton } from "@/components/ui/Buttons";
import { LoginInput, SearchBar } from "@/components/ui/TextInputs";
import { validateClassInput } from "@/lib/utillities";
import {
    Course,
    CourseProfDisplay,
    createNewCourse,
    getCoursesForSearch,
    getProfessorsForCourse,
    ProfessorForCourse,
} from "@/services/courseService";
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
    const searchRef = useRef(0); //ref to make sure loading state is show correctly
    const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
    const [professors, setProfessors] = useState<Record<number, ProfessorForCourse[]>>({});
    const [loadingProfId, setLoadingProfId] = useState<number | null>(null);
    const [addClassExpanded, setAddClassExpanded] = useState(false);
    const [newClassCode, setNewClassCode] = useState("");

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
                    setFoundCourses(
                        //filter out already selected courses
                        results.filter((course) => !selectedCodes.includes(course.code))
                    );
                    setExpandedCourseId(null);
                    setNewClassCode("");
                    setAddClassExpanded(false);
                }
            } finally {
                //only clear loading if still latest
                if (searchRef.current === id) {
                    setLoading(false);
                }
            }
        }, 500); //waits 0.5s after user stops typing to avoid spam api calls

        //clear previous timeout if searchTerm changes quickly
        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedCourseProf]);

    const modalClose = useCallback(() => {
        //clean state when close
        setFoundCourses([]);
        setSearchTerm("");
        setLoading(false);
        setVisible(false);
        setExpandedCourseId(null);
        setAddClassExpanded(false);
        setNewClassCode("");
    }, [setVisible]);

    const keyExtractor = useCallback((item: Course) => String(item.id), []);

    const submitNewClass = async (code: string) => {
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
        const classAddPress = () => {
            setAddClassExpanded(!addClassExpanded);
        };

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
                    <View className="flex flex-row items-center">
                        <Text className="text-colors-secondary text-xl">Can&apos;t find your course? Add it here.</Text>
                        <Ionicons
                            name="caret-forward"
                            size={16}
                            color={colors.secondary}
                            style={{
                                transform: [{ rotate: addClassExpanded ? "90deg" : "0deg" }],
                            }}
                        />
                    </View>
                </TouchableOpacity>
                {addClassExpanded && (
                    <View className="w-3/4 gap-4 p-4 bg-colors-secondary rounded-md items-center">
                        <Text className="text-colors-text text-xl font-semibold">Enter class code:</Text>
                        <LoginInput
                            autoCapitalize="characters"
                            autoComplete="off"
                            value={newClassCode}
                            onChangeText={setNewClassCode}
                            placeholder="CSCI152E"
                        />
                        <RedButton onPress={() => submitNewClass(newClassCode)}>Submit</RedButton>
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
                    //collapse
                    setExpandedCourseId(null);
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
                                style={{
                                    transform: [{ rotate: expanded ? "90deg" : "0deg" }],
                                }}
                            />
                            <Text className="text-xl color-colors-text font-semibold">{item.code}</Text>
                        </View>
                        {expanded && <Text className="text-xl color-colors-textSecondary">Choose Professor:</Text>}
                    </TouchableOpacity>

                    {/* Dropdown section */}
                    {expanded && (
                        <View>
                            {isLoading ? (
                                <ActivityIndicator className="p-8" />
                            ) : profList.length === 0 ? (
                                <Text className="colors-colors-text p-8">No professors</Text>
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
                        </View>
                    )}
                </View>
            );
        },
        [expandedCourseId, professors, loadingProfId, handleProfessorPicked, modalClose]
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
                    autoComplete="off"
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
