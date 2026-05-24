/**
 * UserPicker Component
 * Searchable dropdown for selecting Discord users with tag-style bubbles
 */

import { useState, useRef, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import './UserPicker.css';

const GET_GUILD_MEMBERS = gql`
    query GetGuildMembers($guildId: ID!) {
        guildMembers(guildId: $guildId) {
            id
            username
            displayName
            avatar
        }
    }
`;

interface GuildMember {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
}

interface UserPickerProps {
    guildId: string;
    selectedUsers: GuildMember[];
    onSelectionChange: (users: GuildMember[]) => void;
    placeholder?: string;
    single?: boolean; // If true, only allow one selection
}

export function UserPicker({
    guildId,
    selectedUsers,
    onSelectionChange,
    placeholder = 'Search users...',
    single = false,
}: UserPickerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data, loading } = useQuery<{ guildMembers: GuildMember[] }>(GET_GUILD_MEMBERS, {
        variables: { guildId },
        skip: !guildId,
    });

    const members = data?.guildMembers ?? [];

    // Filter members based on search term
    const filteredMembers = members.filter(member => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            member.username.toLowerCase().includes(search) ||
            member.displayName.toLowerCase().includes(search) ||
            member.id.includes(search)
        );
    });

    // Exclude already selected users
    const availableMembers = filteredMembers.filter(
        member => !selectedUsers.find(s => s.id === member.id)
    );

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectUser = (member: GuildMember) => {
        if (single) {
            onSelectionChange([member]);
        } else {
            onSelectionChange([...selectedUsers, member]);
        }
        setSearchTerm('');
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleContainerClick = () => {
        if (single && selectedUsers.length > 0) {
            // In single mode with a selected user, clicking opens dropdown to replace
            setIsOpen(true);
        }
        inputRef.current?.focus();
    };

    const handleRemoveUser = (userId: string) => {
        onSelectionChange(selectedUsers.filter(u => u.id !== userId));
    };

    const getAvatarUrl = (member: GuildMember) => {
        if (member.avatar) {
            return `https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png?size=32`;
        }
        // Default Discord avatar
        const defaultIndex = (BigInt(member.id) >> 22n) % 6n;
        return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
    };

    return (
        <div className="user-picker" ref={containerRef}>
            <div
                className={`user-picker-input-container ${selectedUsers.length > 0 ? 'has-selection' : ''}`}
                onClick={handleContainerClick}
            >
                {/* Selected user tags */}
                {selectedUsers.map(user => (
                    <span key={user.id} className="user-tag">
                        <img
                            src={getAvatarUrl(user)}
                            alt=""
                            className="user-tag-avatar"
                        />
                        <span className="user-tag-name">
                            {user.displayName}
                        </span>
                        <span className="user-tag-id">#{user.id.slice(-4)}</span>
                        <button
                            type="button"
                            className="user-tag-remove"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveUser(user.id);
                            }}
                            aria-label={`Remove ${user.displayName}`}
                        >
                            ×
                        </button>
                    </span>
                ))}

                {/* Search input - always visible but may be smaller when there's a selection */}
                <input
                    ref={inputRef}
                    type="text"
                    className="user-picker-input"
                    placeholder={selectedUsers.length === 0 ? placeholder : ''}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="user-picker-dropdown">
                    {loading && (
                        <div className="user-picker-loading">Loading members...</div>
                    )}

                    {!loading && availableMembers.length === 0 && (
                        <div className="user-picker-empty">
                            {searchTerm ? 'No matching users found' : 'No users available'}
                        </div>
                    )}

                    {!loading && availableMembers.map(member => (
                        <button
                            key={member.id}
                            type="button"
                            className="user-picker-option"
                            onClick={() => handleSelectUser(member)}
                        >
                            <img
                                src={getAvatarUrl(member)}
                                alt=""
                                className="user-picker-avatar"
                            />
                            <div className="user-picker-info">
                                <span className="user-picker-name">{member.displayName}</span>
                                <span className="user-picker-id">
                                    {member.username} • {member.id}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
