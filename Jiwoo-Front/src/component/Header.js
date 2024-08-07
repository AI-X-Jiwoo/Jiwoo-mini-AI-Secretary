import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Flex, Image, Select, Text, Input, Button } from '@chakra-ui/react';
import { LockIcon, EditIcon, HamburgerIcon } from '@chakra-ui/icons';
import logo from '../logo/JiwooLogo.png';
import Sidebar from '../component/SideBar';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const options = [
        { value: "", label: "선택" },
        { value: "SimilarService", label: "유사서비스" },
        { value: "BusinessSupport", label: "정책" },
        { value: "MarketResearch", label: "시장조사" }
    ];

    const getCurrentDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOption, setSelectedOption] = useState(options[0].value);
    const [startDate, setStartDate] = useState(getCurrentDate());
    const [endDate, setEndDate] = useState(getCurrentDate());
    const [businessInfo, setBusinessInfo] = useState(null);

    useEffect(() => {
        setEndDate(getCurrentDate());

        // URL에서 query 파라미터를 가져옵니다.
        const searchParams = new URLSearchParams(location.search);
        const query = searchParams.get('query');

        // location.state에서 businessInfo를 가져옵니다.
        const stateBusinessInfo = location.state?.businessInfo;

        if (stateBusinessInfo) {
            setBusinessInfo(stateBusinessInfo);
            setSearchTerm(stateBusinessInfo.business || '');
        } else if (query) {
            setBusinessInfo({ business: query });
            setSearchTerm(query);
        }
    }, [location]);

    const handleLogoClick = () => {
        navigate('/');
    };

    const navigateToPage = (page, term) => {
        console.log(`Attempting to navigate to /${page}`);
        const updatedBusinessInfo = {
            ...(businessInfo || {}),
            business: term,
        };

        const searchParams = new URLSearchParams({
            query: term,
            startDate: startDate,
            endDate: endDate
        }).toString();

        navigate(`/${page}?${searchParams}`, {
            state: { businessInfo: updatedBusinessInfo, startDate, endDate }
        });
        console.log(`Navigation completed to /${page}`);
    };

    const handleHeaderSearch = () => {
        if (selectedOption && searchTerm) {
            navigateToPage(selectedOption, searchTerm);
        } else {
            console.log("Please select an option and enter a search term");
        }
    };

    const handleSidebarPageChange = (page, term) => {
        console.log(`Sidebar changing to page: ${page}, with term: ${term}`);
        if (page) {
            navigateToPage(page, term || businessInfo?.business || searchTerm);
        }
        setIsOpen(false);
    };

    return (
        <>
            <Flex bg="blue.800" color="white" p="4" alignItems="center" justifyContent="space-between">
                <Flex alignItems="center">
                    <Button onClick={() => setIsOpen(true)} mr="4">
                        <HamburgerIcon />
                    </Button>
                    <Flex
                        onClick={handleLogoClick}
                        cursor="pointer"
                        _hover={{ opacity: 0.8 }}
                        alignItems="center"
                        mr="6"
                    >
                        <Image src={logo} alt="JIWOO Logo" boxSize="30px" mr="2" />
                        <Text fontSize="xl" fontWeight="bold">JIWOO</Text>
                    </Flex>

                    <Flex alignItems="center">
                        <Flex alignItems="center" mr="4">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                bg="white"
                                color="black"
                                width="150px"
                            />
                            <Text mx="2" fontWeight="bold">~</Text>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                bg="white"
                                color="black"
                                width="150px"
                            />
                        </Flex>
                        <Select
                            value={selectedOption}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            bg="white"
                            color="black"
                            width="120px"
                            mr="2"
                        >
                            {options.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                        <Input
                            placeholder="검색"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            bg="white"
                            color="black"
                            width="300px"
                            mr="2"
                        />
                        <Button colorScheme="blue" onClick={handleHeaderSearch}>
                            검색
                        </Button>
                    </Flex>
                </Flex>

                <Flex align="center">
                    <Button colorScheme="teal" size="sm" mr="4">
                        플랜추가
                    </Button>
                    <Flex
                        mr="4"
                        align="center"
                        cursor="pointer"
                        _hover={{ color: 'teal.200' }}
                    >
                        <LockIcon mr="1" />
                        <Text>로그인</Text>
                    </Flex>
                    <Flex
                        align="center"
                        cursor="pointer"
                        _hover={{ color: 'teal.200' }}
                    >
                        <EditIcon mr="1" />
                        <Text>회원가입</Text>
                    </Flex>
                </Flex>
            </Flex>
            <Sidebar
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                options={options.slice(1)}
                onPageChange={handleSidebarPageChange}
                searchTerm={searchTerm}
                businessInfo={businessInfo}
            />
        </>
    );
};

export default Header;