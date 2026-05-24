import './GuildCard.css';

interface GuildCardProps {
    id: string;
    name: string;
    icon: string | null;
    onClick?: (id: string) => void;
}

export function GuildCard({ id, name, icon, onClick }: GuildCardProps) {
    const getIconUrl = () => {
        if (icon) {
            return `https://cdn.discordapp.com/icons/${id}/${icon}.png`;
        }
        return null;
    };

    const handleClick = () => {
        if (onClick) {
            onClick(id);
        }
    };

    return (
        <div className="guild-card" onClick={handleClick}>
            <div className="guild-icon">
                {getIconUrl() ? (
                    <img src={getIconUrl()!} alt={name} />
                ) : (
                    <span className="guild-initial">{name.charAt(0)}</span>
                )}
            </div>
            <div className="guild-info">
                <h3>{name}</h3>
            </div>
        </div>
    );
}
