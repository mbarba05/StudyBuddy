import supabase from "@/lib/subapase";
import { createProfile, editProfile } from "@/services/profileService";

/*
In here im testing the bio component. 
bio can be added when profile is being created
bio can be left blank when creating profile
bio can be added/edited after the profile is created 

*/

jest.mock("@/lib/subapase", () => ({
    __esModule: true,
    default: {
        auth: {
            getUser: jest.fn(),
        },
        from: jest.fn(),
        storage: {
            from: jest.fn(),
        },
    },
}));

describe("bio feature", () => {
    const mockUserId = "user-123";

    beforeEach(() => {
        jest.clearAllMocks();
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
        });
    });

    it("bio is saved when added", async () => {
        const single = jest.fn().mockResolvedValue({
            data: {
                user_id: mockUserId,
                display_name: "user1",
                year: "Freshman",
                pp_url: null,
                bio: "testing bio",
                major: { id: 1, name: "Computer Science" },
            },
            error: null,
        });
        const select = jest.fn(() => ({ single }));
        const upsert = jest.fn(() => ({ select }));
        const from = jest.fn(() => ({ upsert }));

        (supabase.from as jest.Mock).mockImplementation(from);

        const result = await createProfile({
            displayName: "user1",
            majorId: 1,
            year: "Freshman",
            bio: "testing bio",
        });

        expect(upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                user_id: mockUserId,
                display_name: "user1",
                major_id: 1,
                year: "Freshman",
                bio: "testing bio",
            }),
            { onConflict: "user_id" },
        );
        expect(result.bio).toBe("testing bio");
    });

    it("allows bio to be empty", async () => {
        const single = jest.fn().mockResolvedValue({
            data: {
                user_id: mockUserId,
                display_name: "user1",
                year: "Freshman",
                pp_url: null,
                bio: null,
                major: { id: 1, name: "Computer Science" },
            },
            error: null,
        });
        const select = jest.fn(() => ({ single }));
        const upsert = jest.fn(() => ({ select }));
        const from = jest.fn(() => ({ upsert }));

        (supabase.from as jest.Mock).mockImplementation(from);

        const result = await createProfile({
            displayName: "user1",
            majorId: 1,
            year: "Freshman",
            bio: null,
        });
        expect(upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                bio: null,
            }),
            { onConflict: "user_id" },
        );
        expect(result.bio).toBeNull();
    });

    it("updates bio when edited", async () => {
        const single = jest.fn().mockResolvedValue({
            data: {
                user_id: mockUserId,
                display_name: "user1",
                year: "Freshman",
                pp_url: null,
                bio: "updated bio",
                major: { id: 1, name: "computer Science" },
            },
            error: null,
        });
        const select = jest.fn(() => ({ single }));
        const eq = jest.fn(() => ({ select }));
        const update = jest.fn(() => ({ eq }));
        const from = jest.fn(() => ({ update }));

        (supabase.from as jest.Mock).mockImplementation(from);

        const result = await editProfile({
            bio: "updated bio",
        });

        expect(update).toHaveBeenCalledWith(
            expect.objectContaining({
                bio: "updated bio",
            }),
        );
        expect(result?.bio).toBe("updated bio");
    });
});
