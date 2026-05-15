import React from 'react';
import UserFeedPost from './UserFeedPost';

const dummyPosts = [
    {
        id: 1,
        userName: 'Eric Code',
        userRole: 'Senior Wordpress Developer',
        timeAgo: '3 min ago',
        avatar: '/images/avatar-eric.jpg', // Dummy image path
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam luctus hendrerit metus, ut ullamcorper quam finibus at. Etiam id magna sit amet...',
        skills: ['HTML', 'PHP', 'CSS', 'Javascript', 'Wordpress'],
        jobType: 'Full Time',
        likes: 15,
        comments: 3,
        views: 50,
    },
    {
        id: 2,
        userName: 'Jane Smith',
        userRole: 'UX/UI Designer',
        timeAgo: '1 hour ago',
        avatar: '/images/avatar-jane.jpg', // Dummy image path
        content: 'Excited to share my latest design project for a mobile app. Focused on user-centric design and accessibility...',
        skills: ['Figma', 'Sketch', 'UI/UX', 'Mobile App'],
        jobType: 'Contract',
        likes: 28,
        comments: 7,
        views: 120,
    },
];

export default function UserFeed() {
    return (
        <div className="flex flex-col gap-6">
            {dummyPosts.map(post => (
                <UserFeedPost key={post.id} {...post} />
            ))}
            {/* You would typically fetch more posts here with pagination/infinite scroll */}
        </div>
    );
}
