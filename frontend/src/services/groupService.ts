import api from "@/lib/api";

export interface GroupMember {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
    role: string;
}

export interface Group {
    _id: string;
    name: string;
    description: string;
    groupPhoto?: string;
    members: GroupMember[];
    admins: string[];
    createdBy: string;
    lastMessage?: any;
    updatedAt: string;
}

export const createGroup = async (name: string, description: string, memberIds: string[]) => {
    const response = await api.post('/groups', { name, description, memberIds });
    return response.data;
};

export const getGroups = async () => {
    const response = await api.get('/groups');
    return response.data;
};

export const getGroupDetails = async (groupId: string) => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
};

export const getGroupMessages = async (groupId: string) => {
    const response = await api.get(`/groups/${groupId}/messages`);
    return response.data;
};

export const addGroupMembers = async (groupId: string, memberIds: string[]) => {
    const response = await api.put(`/groups/${groupId}/add`, { memberIds });
    return response.data;
};

export const removeGroupMember = async (groupId: string, userId: string) => {
    const response = await api.put(`/groups/${groupId}/remove`, { userId });
    return response.data;
};

export const leaveGroup = async (groupId: string) => {
    const response = await api.put(`/groups/${groupId}/leave`);
    return response.data;
};
