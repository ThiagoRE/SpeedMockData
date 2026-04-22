// BACKWARD COMPATIBILITY: Este store redirige a useUsersStore
// Las vistas que aún importan useMembersStore seguirán funcionando
import { defineStore } from 'pinia'
import { useUsersStore } from './users'

export const useMembersStore = defineStore('members', () => {
  const usersStore = useUsersStore()

  return {
    users: usersStore.users,
    activeMembers: usersStore.activeUsers,
    getMemberById: usersStore.getUserById,
    getMembersBySport: usersStore.getUsersBySport,
    addMember: usersStore.addUser,
    updateMember: usersStore.updateUser,
    deleteMember: usersStore.deleteUser,
    updateMemberTeamPosition: usersStore.updateUserTeamPosition,
  }
})
