import React from 'react';

export interface Teacher {
    id: string;
    name: string;
    title: string;
    qualification: string;
    specialization: string;
    email: string;
    imageUrl: string;
    mobile_number?: string;
    shift?: 'Morning' | 'Day';
}

const TeacherCard: React.FC<{ member: Teacher }> = ({ member }) => {
    const isHead = member.title.includes('Head of Department');
    
    return (
        <div className={`
            relative flex flex-col gap-4 rounded-xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full
            ${isHead 
                ? 'bg-gradient-to-tr from-primary/10 via-surface to-surface border-2 border-secondary/50 shadow-secondary/20' 
                : 'bg-surface border border-border'}
        `}>
            {member.shift && (
                <div className={`absolute top-4 right-4 px-2.5 py-1 text-xs font-bold text-white rounded-full shadow-md ${member.shift === 'Morning' ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gradient-to-r from-sky-500 to-indigo-600'}`}>
                    {member.shift}
                </div>
            )}
            <div className="flex items-center gap-4">
                <div 
                    className={`w-20 h-20 bg-center bg-no-repeat aspect-square bg-cover rounded-full shrink-0
                        ${isHead ? 'border-4 border-primary' : 'border-2 border-primary/50'}
                    `}
                    style={{ backgroundImage: `url("${member.imageUrl}")` }}>
                </div>
                <div className="flex-1">
                    <p className="text-text text-xl font-bold leading-normal">{member.name}</p>
                    <p className={`
                        text-md font-medium leading-normal
                        ${isHead ? 'gradient-text font-bold' : 'text-text/90'}
                    `}>{member.title}</p>
                </div>
            </div>
            <div>
                <p className="text-text/80 text-sm font-normal leading-normal"><strong>Qualification:</strong> {member.qualification}</p>
                <p className="text-text/80 text-sm font-normal leading-normal mt-1"><strong>Specialization:</strong> {member.specialization}</p>
            </div>
            <div className="mt-auto pt-3 border-t border-border space-y-1.5">
                <div className="flex items-center gap-2 text-text/70">
                    <span className="material-symbols-outlined text-lg">email</span>
                    <a className="text-sm hover:text-primary truncate" href={`mailto:${member.email}`} title={member.email}>{member.email}</a>
                </div>
                {member.mobile_number && (
                    <div className="flex items-center gap-2 text-text/70">
                        <span className="material-symbols-outlined text-lg">call</span>
                        <a className="text-sm hover:text-primary" href={`tel:${member.mobile_number}`}>{member.mobile_number}</a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherCard;