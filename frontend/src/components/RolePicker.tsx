/**
 * RolePicker Component
 * Searchable dropdown for selecting Discord roles
 */

import { useState, useRef, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import './RolePicker.css';

const GET_GUILD_ROLES = gql`
    query GetGuildRoles($guildId: ID!) {
        guildRoles(guildId: $guildId) {
            id
            name
            color
            position
        }
    }
`;

interface GuildRole {
    id: string;
    name: string;
    color: number;
    position: number;
}

interface RolePickerProps {
    guildId: string;
    selectedRole: GuildRole | null;
    onSelectionChange: (role: GuildRole | null) => void;
    placeholder?: string;
}

export function RolePicker({
    guildId,
    selectedRole,
    onSelectionChange,
    placeholder = 'Select a role...',
}: RolePickerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data, loading } = useQuery<{ guildRoles: GuildRole[] }>(GET_GUILD_ROLES, {
        variables: { guildId },
        skip: !guildId,
    });

    const roles = data?.guildRoles ?? [];

    // Sort by position (higher = more important) and filter
    const filteredRoles = roles
        .filter(role => {
            if (!searchTerm) return true;
            return role.name.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => b.position - a.position);

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

    const handleSelectRole = (role: GuildRole) => {
        onSelectionChange(role);
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleClear = () => {
        onSelectionChange(null);
        setSearchTerm('');
    };

    const getColorHex = (color: number) => {
        if (color === 0) return 'var(--color-text-secondary)';
        return `#${color.toString(16).padStart(6, '0')}`;
    };

    return (
        <div className="role-picker" ref={containerRef}>
            <div
                className={`role-picker-input-container ${selectedRole ? 'has-selection' : ''}`}
                onClick={() => {
                    setIsOpen(true);
                    inputRef.current?.focus();
                }}
            >
                {selectedRole ? (
                    <span
                        className="role-tag"
                        style={{ borderColor: getColorHex(selectedRole.color) }}
                    >
                        <span
                            className="role-color-dot"
                            style={{ backgroundColor: getColorHex(selectedRole.color) }}
                        />
                        <span className="role-tag-name">{selectedRole.name}</span>
                        <button
                            type="button"
                            className="role-tag-remove"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClear();
                            }}
                            aria-label={`Remove ${selectedRole.name}`}
                        >
                            ×
                        </button>
                    </span>
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        className="role-picker-input"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onFocus={() => setIsOpen(true)}
                    />
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="role-picker-dropdown">
                    {loading && (
                        <div className="role-picker-loading">Loading roles...</div>
                    )}

                    {!loading && filteredRoles.length === 0 && (
                        <div className="role-picker-empty">
                            {searchTerm ? 'No matching roles found' : 'No roles available'}
                        </div>
                    )}

                    {!loading && filteredRoles.map(role => (
                        <button
                            key={role.id}
                            type="button"
                            className="role-picker-option"
                            onClick={() => handleSelectRole(role)}
                        >
                            <span
                                className="role-color-dot"
                                style={{ backgroundColor: getColorHex(role.color) }}
                            />
                            <span className="role-picker-name">{role.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
