import CourseSearchModal from "@/components/features/courses/CourseSearchModal";
import supabase from "@/lib/subapase";
import { createNewCourse, getCoursesForSearch, getProfessorsForCourse } from "@/services/courseService";
import {
    createCourseProf,
    createProfessor,
    getProfessorsForSearch,
    linkProfToMajor,
} from "@/services/professorService";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

// mocking
jest.mock("@/lib/subapase", () => ({
    __esModule: true,
    default: {
        from: jest.fn(),
    },
}));
jest.mock("@/services/courseService", () => ({
    createNewCourse: jest.fn(),
    getCoursesForSearch: jest.fn(),
    getProfessorsForCourse: jest.fn(),
}));
jest.mock("@/services/professorService", () => ({
    createCourseProf: jest.fn(),
    createProfessor: jest.fn(),
    getProfessorsForSearch: jest.fn(),
    linkProfToMajor: jest.fn(),
}));
jest.mock("react-native-dropdown-picker", () => {
    const React = require("react");
    const { View, Text, TouchableOpacity } = require("react-native");
    return function MockDropDownPicker(props: any) {
        return (
            <View>
                <Text>Mock Major Picker</Text>
                <TouchableOpacity testID="select-major-button" onPress={() => props.setValue([1])}>
                    <Text>Select CSCI</Text>
                </TouchableOpacity>
            </View>
        );
    };
});

describe("CourseSearchModal", () => {
    const mockedSupabase = supabase as jest.Mocked<typeof supabase>;
    const mockedGetCoursesForSearch = getCoursesForSearch as jest.Mock;
    const mockedGetProfessorsForCourse = getProfessorsForCourse as jest.Mock;
    const mockedGetProfessorsForSearch = getProfessorsForSearch as jest.Mock;
    const mockedCreateProfessor = createProfessor as jest.Mock;
    const mockedLinkProfToMajor = linkProfToMajor as jest.Mock;
    const mockedCreateCourseProf = createCourseProf as jest.Mock;
    const mockedCreateNewCourse = createNewCourse as jest.Mock;

    const handleProfessorPicked = jest.fn();
    const setVisible = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        const order = jest.fn().mockResolvedValue({
            data: [
                { id: 1, name: "CSCI" },
                { id: 2, name: "COMM" },
                { id: 3, name: "PHYS" },
            ],
            error: null,
        });
        const select = jest.fn().mockReturnValue({ order });
        (mockedSupabase.from as jest.Mock).mockReturnValue({ select });
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    function renderModal() {
        return render(
            <CourseSearchModal
                visible={true}
                setVisible={setVisible}
                handleProfessorPicked={handleProfessorPicked}
                selectedCourseProf={[]}
            />,
        );
    }

    it("shows searched course results", async () => {
        mockedGetCoursesForSearch.mockResolvedValue([{ id: 101, code: "CSCI 152" }]);

        const { getByPlaceholderText, findByText } = renderModal();

        fireEvent.changeText(getByPlaceholderText(/Search for a course/i), "CSCI");

        await act(async () => {
            jest.advanceTimersByTime(500);
        });
        expect(await findByText("CSCI 152")).toBeTruthy();
    });

    it("calls handleProfessorPicked when an existing professor chip is pressed", async () => {
        mockedGetCoursesForSearch.mockResolvedValue([{ id: 101, code: "CSCI 152" }]);
        mockedGetProfessorsForCourse.mockResolvedValue([
            {
                course_prof_id: 77,
                professor_id: 88,
                name: "Existing Professor",
            },
        ]);
        const { getByPlaceholderText, findByText } = renderModal();

        fireEvent.changeText(getByPlaceholderText(/Search for a course/i), "CSCI");
        await act(async () => {
            jest.advanceTimersByTime(500);
        });

        fireEvent.press(await findByText("CSCI 152"));
        fireEvent.press(await findByText("Existing Professor"));

        expect(handleProfessorPicked).toHaveBeenCalledWith({
            prof_name: "Existing Professor",
            course_code: "CSCI 152",
            course_prof_id: 77,
        });
    });

    it("Creates and links new professors with majors", async () => {
        mockedGetCoursesForSearch.mockResolvedValue([{ id: 101, code: "CSCI 152" }]);
        mockedGetProfessorsForCourse.mockResolvedValue([]);
        mockedGetProfessorsForSearch.mockResolvedValue([]);
        mockedCreateProfessor.mockResolvedValue(500);
        mockedLinkProfToMajor.mockResolvedValue(true);
        mockedCreateCourseProf.mockResolvedValue(999);

        const { getByPlaceholderText, findByText, getByText, getByTestId } = renderModal();

        fireEvent.changeText(getByPlaceholderText(/Search for a course/i), "CSCI");

        await act(async () => {
            jest.advanceTimersByTime(500);
        });

        fireEvent.press(await findByText("CSCI 152"));
        fireEvent.press(getByText("Don't see your Professor? Add them here"));

        fireEvent.changeText(getByPlaceholderText(/Type at least 3 characters/i), "New Professor");

        await act(async () => {
            jest.advanceTimersByTime(500);
        });

        expect(await findByText("Select the Majors the Professor is associated with")).toBeTruthy();
        fireEvent.press(getByTestId("select-major-button"));
        const confirmButton = await findByText(/Click To Confirm New Professor/);
        fireEvent.press(confirmButton);

        await waitFor(() => {
            expect(mockedCreateProfessor).toHaveBeenCalledWith("New Professor");
        });
        await waitFor(() => {
            expect(mockedLinkProfToMajor).toHaveBeenCalledWith(500, 1);
        });
        await waitFor(() => {
            expect(mockedCreateCourseProf).toHaveBeenCalledWith(500, 101);
        });
        await waitFor(() => {
            expect(handleProfessorPicked).toHaveBeenCalledWith({
                course_code: "CSCI 152",
                course_prof_id: 999,
                prof_name: "New Professor",
            });
        });
    });
});
